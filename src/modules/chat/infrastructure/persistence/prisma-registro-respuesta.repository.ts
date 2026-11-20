import { Prisma } from '@prisma/client';
import {
  RegistroDeRespuesta,
  RegistroRespuestaTransaccion,
} from '../../application/ports/procesar-respuesta.port';
import { esObjetoRespuesta } from '../../domain/policies/configuracion-entrada-respuesta';

/** Persistencia y bloqueos; el resultado y el estado vienen decididos por aplicación. */
export class PrismaRegistroRespuestaRepository implements RegistroRespuestaTransaccion {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async buscarResultado(idInteraccion: string) {
    // Serializa también colisiones del UUID entre sesiones distintas. No es un
    // bloqueo de sesión: evita depender de una excepción de unicidad para reintentar.
    await this.tx
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${idInteraccion}::text, 0))`;
    const fila = await this.tx.interacciones.findUnique({
      where: { id_interaccion: idInteraccion },
      select: {
        id_sesion: true,
        respuestas: { select: { resultado_procesamiento: true }, take: 2 },
      },
    });
    if (fila === null) return null;
    const guardado =
      fila.respuestas.length === 1
        ? fila.respuestas[0].resultado_procesamiento
        : null;
    return {
      idSesion: fila.id_sesion,
      resultado: esObjetoRespuesta(guardado) ? guardado.resultado : null,
      huella:
        esObjetoRespuesta(guardado) && typeof guardado.huella === 'string'
          ? guardado.huella
          : null,
    };
  }

  async ultimaSecuencia(idSesion: string): Promise<number> {
    const ultima = await this.tx.interacciones.findFirst({
      where: { id_sesion: idSesion },
      orderBy: { secuencia: 'desc' },
      select: { secuencia: true },
    });
    return ultima?.secuencia ?? 0;
  }

  async guardar({
    solicitud: s,
    decision,
    resultado,
    huella,
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
    const conexion = await this.tx.estado_conectividad.findUnique({
      where: { nombre: s.conectividad },
    });
    if (!tipo || !conexion)
      throw new Error('Catálogos de respuesta no disponibles.');
    const valor =
      decision.respuesta === null ? Prisma.JsonNull : decision.respuesta;
    const recursos = s.recursosNoPresentados
      ? Prisma.sql`ARRAY[${Prisma.join(s.recursosNoPresentados)}]::uuid[]`
      : Prisma.sql`NULL`;
    const fechaCaptura = new Date(s.timestampInteraccion);
    // Prisma no representa el NULL de uuid[]; PostgreSQL también conserva aquí
    // la precisión del timestamp recibido sin convertirlo a Date.
    await this.tx.$executeRaw`
      INSERT INTO chat.interacciones (
        id_interaccion, id_sesion, id_nodo, secuencia, timestamp_interaccion,
        fecha_creacion, recursos_no_presentados
      ) VALUES (
        ${s.idInteraccion}::uuid, ${s.idSesion}::uuid, ${s.idNodo}::uuid,
        ${s.secuencia}::integer, ${s.timestampInteraccion}::timestamptz,
        ${ahora}::timestamptz, ${recursos}
      )`;
    await this.tx.respuestas.create({
      data: {
        id_interaccion: s.idInteraccion,
        id_nodo: s.idNodo,
        id_tipo_entrada: tipo.id_tipo_entrada,
        id_estado_conectividad: conexion.id_estado_conectividad,
        valor_respuesta: valor,
        es_valida: true,
        fecha_captura: fechaCaptura,
        resultado_procesamiento: {
          huella,
          resultado: { ...resultado, transicion: { ...resultado.transicion } },
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
        timestamp_interaccion: fechaCaptura,
        id_interaccion: s.idInteraccion,
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
        estado_actual: resultado.estado_sesion,
        fecha_actualizacion: ahora,
        ...(resultado.estado_sesion === 'COMPLETADA' && {
          fecha_completada: ahora,
        }),
      },
    });
  }
}
