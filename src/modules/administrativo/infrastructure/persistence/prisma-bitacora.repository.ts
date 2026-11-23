import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { BitacoraRepository } from '../../application/ports/auditoria.port';
import type {
  EntradaBitacora,
  RegistroAuditoria,
} from '../../domain/auditoria';

@Injectable()
export class PrismaBitacoraRepository implements BitacoraRepository {
  constructor(private readonly prisma: PrismaService) {}

  enTransaccion<T>(
    operacion: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(operacion);
  }

  async insertar(
    tx: Prisma.TransactionClient,
    registro: RegistroAuditoria,
    diferido: boolean,
  ): Promise<void> {
    const conflicto = diferido
      ? Prisma.sql`ON CONFLICT (id_auditoria) DO NOTHING`
      : Prisma.empty;
    await tx.$executeRaw`
      INSERT INTO administrativo.bitacora_auditoria (
        id_auditoria, id_usuario_administrativo, id_sesion, accion, recurso_afectado,
        id_recurso, direccion_ip, marca_temporal, estado_accion, registrado_diferido, detalle
      ) VALUES (
        ${registro.id_auditoria}::uuid, ${registro.idUsuario}::uuid, ${registro.idSesion}::uuid,
        ${registro.accion}::administrativo.accion_admin_enum, ${registro.recurso_afectado},
        ${registro.id_recurso}::uuid, ${registro.direccionIp}, ${registro.marca_temporal}::timestamptz,
        ${registro.estado_accion}::administrativo.estado_accion_enum, ${diferido},
        ${JSON.stringify(registro.detalle ?? {})}::jsonb
      ) ${conflicto}
    `;
  }

  listar(
    tx: Prisma.TransactionClient,
    cursor: string | null,
    limite: number,
  ): Promise<EntradaBitacora[]> {
    const desde =
      cursor === null
        ? Prisma.empty
        : Prisma.sql`
      WHERE (marca_temporal, id_auditoria) < (
        SELECT marca_temporal, id_auditoria FROM administrativo.bitacora_auditoria
        WHERE id_auditoria = ${cursor}::uuid
      )`;
    return tx.$queryRaw<EntradaBitacora[]>`
      SELECT id_auditoria, accion::text AS accion, recurso_afectado, id_recurso,
             direccion_ip, marca_temporal, estado_accion::text AS estado_accion
      FROM administrativo.bitacora_auditoria
      ${desde}
      ORDER BY marca_temporal DESC, id_auditoria DESC
      LIMIT ${limite}
    `;
  }
}
