import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { SeguimientoIndividualRepository } from '../../domain/repositories/seguimiento-individual.repository';

@Injectable()
export class PrismaSeguimientoIndividualRepository implements SeguimientoIndividualRepository {
  async buscarIdParticipante(tx: Prisma.TransactionClient, codigo: string) {
    const [fila] = await tx.$queryRaw<{ id_usuario: string }[]>`
      SELECT s.id_usuario
      FROM administrativo.seudonimos_participante s
      JOIN usuario.usuarios u ON u.id_usuario = s.id_usuario AND u.rol = 'ESTUDIANTE'
      WHERE s.codigo_participante = ${codigo}
    `;
    return fila?.id_usuario ?? null;
  }

  async buscarAlertasAtendidas(
    tx: Prisma.TransactionClient,
    idParticipante: string,
    idsAlerta: string[],
  ) {
    // Un id que no es UUID no puede estar en la tabla y haría fallar el cast.
    const ids = [...new Set(idsAlerta.filter((id) => isUUID(id)))];
    if (ids.length === 0) return new Map<string, Date>();
    const filas = await tx.$queryRaw<
      { id_alerta_externo: string; fecha_atencion: Date }[]
    >`
      SELECT id_alerta_externo::text AS id_alerta_externo, fecha_atencion
      FROM administrativo.alertas_gestion_admin
      WHERE id_alerta_externo = ANY(${ids}::uuid[]) AND estado = 'ATENDIDA'
        AND id_participante = ${idParticipante}::uuid
    `;
    // Postgres devuelve el UUID en minúsculas: se indexa con el id tal como llegó de M05.
    const porId = new Map(
      filas.map((fila) => [fila.id_alerta_externo, fila.fecha_atencion]),
    );
    const atendidas = new Map<string, Date>();
    for (const id of idsAlerta) {
      const fecha = porId.get(id.toLowerCase());
      if (fecha) atendidas.set(id, fecha);
    }
    return atendidas;
  }
}
