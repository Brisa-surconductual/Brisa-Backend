import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VistasAgregadasRepository } from '../../application/ports/vistas-agregadas.repository';
import type {
  DatosVistaAgregada,
  TipoVistaAgregada,
} from '../../domain/vista-agregada';

@Injectable()
export class PrismaVistasAgregadasRepository implements VistasAgregadasRepository {
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
    vista: TipoVistaAgregada,
  ): Promise<unknown> {
    const [fila] = await tx.$queryRaw<{ payload: unknown }[]>`
      SELECT payload FROM administrativo.snapshots_vista
      WHERE id_cohorte = ${idCohorte}::uuid AND vista = ${vista}::administrativo.vista_agregada_enum
    `;
    return fila?.payload ?? null;
  }

  async guardar(
    tx: Prisma.TransactionClient,
    idCohorte: string,
    vista: TipoVistaAgregada,
    datos: DatosVistaAgregada,
  ) {
    return (
      (await this.escribir(
        tx,
        idCohorte,
        vista,
        datos,
        new Date(datos.fecha_actualizacion),
      )) > 0
    );
  }

  async suprimir(
    tx: Prisma.TransactionClient,
    idCohorte: string,
    vista: TipoVistaAgregada,
  ) {
    await this.escribir(
      tx,
      idCohorte,
      vista,
      { estado: 'SUPRIMIDO' },
      new Date(),
    );
  }

  private async escribir(
    tx: Prisma.TransactionClient,
    idCohorte: string,
    vista: TipoVistaAgregada,
    payload: DatosVistaAgregada | { estado: 'SUPRIMIDO' },
    fechaDato: Date,
  ) {
    const precedencia =
      'estado' in payload
        ? Prisma.empty
        : Prisma.sql`AND (anterior.fecha_dato <= EXCLUDED.fecha_dato OR anterior.payload ->> 'estado' = 'SUPRIMIDO')`;
    return tx.$executeRaw`
      INSERT INTO administrativo.snapshots_vista AS anterior (id_cohorte, vista, payload, fecha_dato)
      VALUES (${idCohorte}::uuid, ${vista}::administrativo.vista_agregada_enum, ${JSON.stringify(payload)}::jsonb, ${fechaDato}::timestamptz)
      ON CONFLICT (id_cohorte, vista) DO UPDATE SET
        payload = EXCLUDED.payload, fecha_dato = EXCLUDED.fecha_dato, fecha_captura = EXCLUDED.fecha_captura
      WHERE anterior.fecha_captura <= EXCLUDED.fecha_captura ${precedencia}
    `;
  }
}
