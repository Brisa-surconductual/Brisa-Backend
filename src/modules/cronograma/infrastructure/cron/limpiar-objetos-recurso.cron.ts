import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { AlmacenamientoRecursosPort } from '../../application/ports/almacenamiento-recursos.port';

interface LimpiezaPendiente {
  id_limpieza: bigint;
  id_contenido: string;
  clave_almacenamiento: string;
  intentos: number;
}

@Injectable()
export class LimpiarObjetosRecursoCron {
  private readonly logger = new Logger(LimpiarObjetosRecursoCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly almacenamiento: AlmacenamientoRecursosPort,
  ) {}

  @Cron('*/5 * * * *')
  async ejecutar(): Promise<void> {
    let pendientes: LimpiezaPendiente[];
    try {
      pendientes = await this.prisma.$transaction((tx) =>
        tx.$queryRaw<LimpiezaPendiente[]>(Prisma.sql`
        WITH lote AS (
          SELECT id_limpieza
          FROM cronograma.limpieza_objetos_recurso
          WHERE (estado = 'PENDIENTE' AND disponible_desde <= now())
             OR (estado = 'EN_PROCESO' AND reclamado_en < now() - interval '10 minutes')
          ORDER BY disponible_desde, id_limpieza
          FOR UPDATE SKIP LOCKED
          LIMIT 20
        )
        UPDATE cronograma.limpieza_objetos_recurso AS cola
        SET estado = 'EN_PROCESO', reclamado_en = now(), intentos = intentos + 1
        FROM lote
        WHERE cola.id_limpieza = lote.id_limpieza
        RETURNING cola.id_limpieza, cola.id_contenido, cola.clave_almacenamiento, cola.intentos
      `),
      );
    } catch {
      this.logger.error(
        'No fue posible consultar los objetos pendientes de limpieza.',
      );
      return;
    }

    for (const pendiente of pendientes) {
      try {
        const referenciado = await this.prisma.recursos_contenido.findFirst({
          where: { clave_almacenamiento: pendiente.clave_almacenamiento },
          select: { id_recurso: true },
        });
        if (!referenciado) {
          await this.almacenamiento.eliminarObjeto({
            idContenido: pendiente.id_contenido,
            claveAlmacenamiento: pendiente.clave_almacenamiento,
          });
        }
        await this.prisma.$executeRaw(Prisma.sql`
          UPDATE cronograma.limpieza_objetos_recurso
          SET estado = 'COMPLETADO', fecha_completado = now(), reclamado_en = NULL, ultimo_error = NULL
          WHERE id_limpieza = ${pendiente.id_limpieza}
        `);
      } catch {
        const segundos = Math.min(
          3600,
          30 * 2 ** Math.min(pendiente.intentos, 7),
        );
        await this.prisma.$executeRaw(Prisma.sql`
          UPDATE cronograma.limpieza_objetos_recurso
          SET estado = 'PENDIENTE', reclamado_en = NULL,
              disponible_desde = now() + (${segundos} * interval '1 second'),
              ultimo_error = 'Fallo al eliminar objeto del almacenamiento'
          WHERE id_limpieza = ${pendiente.id_limpieza}
        `);
        this.logger.warn(
          `Se reintentará la limpieza del objeto ${pendiente.id_limpieza}.`,
        );
      }
    }
  }
}
