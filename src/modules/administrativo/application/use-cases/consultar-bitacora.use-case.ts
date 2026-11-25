import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { AccionAuditable } from '../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { CursorBitacoraInvalidoException } from '../exceptions/cursor-bitacora-invalido.exception';
import { LimiteBitacoraInvalidoException } from '../exceptions/limite-bitacora-invalido.exception';
import { BitacoraRepository } from '../ports/auditoria.port';
import { AuditoriaService } from '../services/auditoria.service';

@Injectable()
export class ConsultarBitacoraUseCase {
  constructor(
    private readonly bitacora: BitacoraRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  execute(
    ctx: ContextoAuditoria,
    accion: AccionAuditable,
    cursor: unknown,
    limite: unknown,
  ) {
    return this.auditoria.ejecutar(ctx, accion, async (tx) => {
      if (
        cursor !== undefined &&
        (typeof cursor !== 'string' || !isUUID(cursor))
      )
        throw new CursorBitacoraInvalidoException();
      const maximo =
        limite === undefined
          ? 20
          : typeof limite === 'string' && /^\d{1,3}$/.test(limite)
            ? Number(limite)
            : NaN;
      if (!Number.isInteger(maximo) || maximo < 1 || maximo > 100)
        throw new LimiteBitacoraInvalidoException();

      const filas = await this.bitacora.listar(tx, cursor ?? null, maximo + 1);
      const data = filas.slice(0, maximo);
      const hayMas = filas.length > maximo;
      return {
        data,
        meta: {
          hay_mas: hayMas,
          siguiente_cursor: hayMas ? (data.at(-1)?.id_auditoria ?? null) : null,
        },
      };
    });
  }
}
