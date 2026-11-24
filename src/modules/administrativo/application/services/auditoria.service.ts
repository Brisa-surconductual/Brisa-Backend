import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type {
  AccionAuditable,
  ContextoAuditoria,
  EstadoAccion,
  EventoAuditoria,
  RegistroAuditoria,
} from '../../domain/auditoria';
import { BitacoraRepository, ColaAuditoriaPort } from '../ports/auditoria.port';

type ModoRegistro =
  { modo: 'SINCRONO'; tx: Prisma.TransactionClient } | { modo: 'DIFERIDO' };

export class RegistroAuditoriaException extends InternalServerErrorException {
  constructor() {
    super({
      statusCode: 500,
      codigo: 'ERROR_REGISTRO_AUDITORIA',
      mensaje:
        'No fue posible registrar la acción en la bitácora de auditoría.',
    });
  }
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(
    private readonly bitacora: BitacoraRepository,
    private readonly cola: ColaAuditoriaPort,
  ) {}

  async registrar(
    ctx: ContextoAuditoria,
    evento: EventoAuditoria,
    opciones: ModoRegistro,
  ): Promise<string> {
    const registro: RegistroAuditoria = {
      ...ctx,
      id_auditoria: evento.idAuditoria ?? randomUUID(),
      accion: evento.accion,
      recurso_afectado: evento.recurso,
      id_recurso: evento.idRecurso ?? null,
      marca_temporal: new Date().toISOString(),
      estado_accion: evento.estado,
      ...(evento.detalle && { detalle: evento.detalle }),
    };

    try {
      if (opciones.modo === 'SINCRONO')
        await this.bitacora.insertar(opciones.tx, registro, false);
      else await this.cola.encolar(registro);
    } catch {
      throw new RegistroAuditoriaException();
    }
    return registro.id_auditoria;
  }

  async ejecutar<T>(
    ctx: ContextoAuditoria,
    accion: AccionAuditable,
    operacion: (tx: Prisma.TransactionClient) => Promise<T>,
    estadoResultado?: (resultado: T) => EstadoAccion,
  ): Promise<T> {
    try {
      return await this.bitacora.enTransaccion(async (tx) => {
        const resultado = await operacion(tx);
        await this.registrar(
          ctx,
          { ...accion, estado: estadoResultado?.(resultado) ?? 'EXITOSA' },
          { modo: 'SINCRONO', tx },
        );
        return resultado;
      });
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : 500;
      await this.registrarIntento(
        ctx,
        accion,
        status === 401 || status === 403 ? 'DENEGADA' : 'FALLIDA',
      );
      throw error;
    }
  }

  async registrarIntento(
    ctx: ContextoAuditoria,
    accion: AccionAuditable,
    estado: Exclude<EstadoAccion, 'EXITOSA'>,
  ): Promise<void> {
    try {
      await this.bitacora.enTransaccion((tx) =>
        this.registrar(ctx, { ...accion, estado }, { modo: 'SINCRONO', tx }),
      );
    } catch {
      this.logger.error(
        'No se pudo conservar el intento de una acción administrativa.',
      );
    }
  }
}
