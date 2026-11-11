import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  RegistroDeRespuesta,
  RegistroRespuestaTransaccion,
} from '../../application/ports/procesar-respuesta.port';

/** Persistencia y bloqueos; el resultado y el estado vienen decididos por aplicación. */
export class PrismaRegistroRespuestaRepository implements RegistroRespuestaTransaccion {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async buscarResultado(idRespuesta: string) {
    // Serializa también colisiones del UUID entre sesiones distintas. No es un
    // bloqueo de sesión: evita depender de una excepción de unicidad para reintentar.
    await this.tx
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${idRespuesta}::text, 0))`;
    const fila = await this.tx.respuestas.findUnique({
      where: { id_respuesta: idRespuesta },
      select: {
        resultado_procesamiento: true,
        interacciones: { select: { id_sesion: true } },
      },
    });
    return fila === null
      ? null
      : {
          idSesion: fila.interacciones.id_sesion,
          resultado: fila.resultado_procesamiento,
        };
  }

  async guardar({
    solicitud: s,
    decision,
    resultado,
    ahora,
  }: RegistroDeRespuesta): Promise<void> {
    const alias: Record<string, string> = {
      OPCION_UNICA: 'SELECCION_UNICA',
      MULTISELECCION: 'SELECCION_MULTIPLE',
    };
    const tipos = await this.tx.tipo_entrada.findMany({
      where: {
        nombre: {
          in: [
            decision.tipoEntrada,
            alias[decision.tipoEntrada] ?? decision.tipoEntrada,
          ],
        },
      },
    });
    const tipo =
      tipos.find((t) => t.nombre === decision.tipoEntrada) ?? tipos[0];
    const conexiones = await this.tx.estado_conectividad.findMany({
      where: { nombre: { in: ['EN_LINEA', 'ONLINE'] } },
    });
    const conexion =
      conexiones.find((c) => c.nombre === 'EN_LINEA') ?? conexiones[0];
    if (!tipo || !conexion)
      throw new Error('Catálogos de respuesta no disponibles.');
    const valor =
      decision.respuesta === null ? Prisma.JsonNull : decision.respuesta;
    const idInteraccion = randomUUID();
    await this.tx.interacciones.create({
      data: {
        id_interaccion: idInteraccion,
        id_sesion: s.idSesion,
        id_nodo: s.idNodo,
        timestamp_interaccion: s.fechaCaptura,
      },
    });
    await this.tx.respuestas.create({
      data: {
        id_respuesta: s.idRespuesta,
        id_interaccion: idInteraccion,
        id_nodo: s.idNodo,
        id_tipo_entrada: tipo.id_tipo_entrada,
        id_estado_conectividad: conexion.id_estado_conectividad,
        valor_respuesta: valor,
        es_valida: true,
        fecha_captura: s.fechaCaptura,
        resultado_procesamiento: {
          ...resultado,
          transicion: { ...resultado.transicion },
        },
      },
    });
    await this.tx.historial_nodos.create({
      data: {
        id_sesion: s.idSesion,
        id_nodo: s.idNodo,
        id_usuario: s.idUsuario,
        respuesta_usuario: valor,
        id_nodo_destino: decision.idNodoDestino,
        timestamp_interaccion: s.fechaCaptura,
      },
    });
    await this.tx.chat_sesiones.update({
      where: { id_sesion: s.idSesion },
      data: {
        id_nodo_actual: decision.idNodoDestino,
        fecha_ultima_interaccion: ahora,
      },
    });
    await this.tx.estado_sesiones.update({
      where: { id_sesion: s.idSesion },
      data: {
        estado_actual: resultado.estadoSesion,
        fecha_actualizacion: ahora,
        ...(resultado.estadoSesion === 'COMPLETADA' && {
          fecha_completada: ahora,
        }),
      },
    });
  }
}
