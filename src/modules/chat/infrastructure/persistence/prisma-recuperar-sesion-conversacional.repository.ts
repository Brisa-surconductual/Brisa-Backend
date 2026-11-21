import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  RecuperarSesionConversacionalPort,
  RecuperarSesionTransaccion,
} from '../../application/ports/recuperar-sesion-conversacional.port';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { actualizarSesionConversacional } from './prisma-actualizar-sesion-conversacional';
import { PrismaContextoRespuestaRepository } from './prisma-contexto-respuesta.repository';
import { PrismaHistorialInteraccionesRepository } from './prisma-historial-interacciones.repository';

@Injectable()
export class PrismaRecuperarSesionConversacionalRepository implements RecuperarSesionConversacionalPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historial: PrismaHistorialInteraccionesRepository,
  ) {}

  ejecutar<T>(
    operacion: (tx: RecuperarSesionTransaccion) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      (tx) => {
        const contexto = new PrismaContextoRespuestaRepository(tx);
        return operacion({
          bloquearSesion: (idSesion, idUsuario) =>
            contexto.bloquearSesion(idSesion, idUsuario),
          buscarNodo: (idNodo) => contexto.buscarNodo(idNodo),
          buscarUltimoDestino: (sesion) => this.buscarUltimoDestino(tx, sesion),
          guardarReanudacion: (sesion, anterior) =>
            actualizarSesionConversacional(tx, sesion, anterior.estadoActual),
          consultarHistorial: (consulta) =>
            this.historial.consultarEn(tx, consulta),
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  private async buscarUltimoDestino(
    tx: Prisma.TransactionClient,
    sesion: SesionConversacional,
  ): Promise<string | null> {
    const [ultimo] = await tx.$queryRaw<{ id_nodo_destino: string }[]>`
      SELECT h.id_nodo_destino
      FROM chat.historial_nodos h
      JOIN chat.nodos destino ON destino.id_nodo = h.id_nodo_destino
      JOIN chat.nodos origen ON origen.id_nodo = h.id_nodo
      LEFT JOIN chat.interacciones i ON i.id_interaccion = h.id_interaccion
      WHERE h.id_sesion = ${sesion.idSesion}::uuid
        AND h.id_usuario = ${sesion.idUsuario}::uuid
        AND h.estado_registro = 'REGISTRADO'
        AND destino.id_flujo = ${sesion.idFlujoConversacional}::uuid
        AND origen.id_flujo = destino.id_flujo
        AND (h.id_interaccion IS NULL OR (i.id_sesion = h.id_sesion AND i.id_nodo = h.id_nodo))
      ORDER BY i.secuencia DESC NULLS LAST, h.id_historial DESC
      LIMIT 1`;
    return ultimo?.id_nodo_destino ?? null;
  }
}
