import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VistasConductualesRepository } from '../../application/ports/vistas-conductuales.repository';
import type { DatosConductuales } from '../../domain/vista-conductual';

@Injectable()
export class PrismaVistasConductualesRepository implements VistasConductualesRepository {
  async bloquearCohorteActiva(tx: Prisma.TransactionClient, idCohorte: string) {
    const [fila] = await tx.$queryRaw<{ id_cohorte: string }[]>`
      SELECT c.id_cohorte FROM administrativo.cohortes c
      JOIN cronograma.cronogramas cr USING (id_cronograma)
      WHERE c.id_cohorte = ${idCohorte}::uuid AND c.fecha_eliminacion IS NULL
        AND c.estado = 'ACTIVA' AND cr.estado = 'ACTIVO'
      FOR SHARE OF c
    `;
    return Boolean(fila);
  }

  async obtenerUltimo(
    tx: Prisma.TransactionClient,
    idCohorte: string,
  ): Promise<unknown> {
    const [fila] = await tx.$queryRaw<{ payload: unknown }[]>`
      SELECT payload FROM administrativo.snapshots_vista
      WHERE id_cohorte = ${idCohorte}::uuid AND vista = 'CONDUCTUAL'
    `;
    return fila?.payload ?? null;
  }

  async guardar(
    tx: Prisma.TransactionClient,
    idCohorte: string,
    datos: DatosConductuales,
  ) {
    return (
      (await this.escribir(
        tx,
        idCohorte,
        datos,
        new Date(datos.fecha_actualizacion),
      )) > 0
    );
  }

  async suprimir(tx: Prisma.TransactionClient, idCohorte: string) {
    await this.escribir(tx, idCohorte, { estado: 'SUPRIMIDO' }, new Date());
  }

  private async escribir(
    tx: Prisma.TransactionClient,
    idCohorte: string,
    payload: DatosConductuales | { estado: 'SUPRIMIDO' },
    fechaDato: Date,
  ) {
    const precedencia =
      'estado' in payload
        ? Prisma.empty
        : Prisma.sql`AND (anterior.fecha_dato <= EXCLUDED.fecha_dato OR anterior.payload ->> 'estado' = 'SUPRIMIDO')`;
    return tx.$executeRaw`
      INSERT INTO administrativo.snapshots_vista AS anterior (id_cohorte, vista, payload, fecha_dato)
      VALUES (${idCohorte}::uuid, 'CONDUCTUAL', ${JSON.stringify(payload)}::jsonb, ${fechaDato}::timestamptz)
      ON CONFLICT (id_cohorte, vista) DO UPDATE SET
        payload = EXCLUDED.payload, fecha_dato = EXCLUDED.fecha_dato, fecha_captura = EXCLUDED.fecha_captura
      WHERE anterior.fecha_captura <= EXCLUDED.fecha_captura ${precedencia}
    `;
  }
}
