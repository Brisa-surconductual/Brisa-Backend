import { HttpException, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { RegistroAuditoria } from '../../domain/entities/auditoria/registro-auditoria.entity';
import { EstadoAccion } from '../../domain/enums/estado-accion.enum';
import { ModoRegistroAuditoria } from '../../domain/enums/modo-registro-auditoria.enum';
import type {
  AccionAuditable,
  EventoAuditoria,
} from '../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { RegistroAuditoriaException } from '../exceptions/registro-auditoria.exception';
import { BitacoraRepository, ColaAuditoriaPort } from '../ports/auditoria.port';

type ModoRegistro =
  | {
      modo: typeof ModoRegistroAuditoria.SINCRONO;
      tx: Prisma.TransactionClient;
    }
  | { modo: typeof ModoRegistroAuditoria.DIFERIDO };

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
      ...(evento.severidad && { severidad: evento.severidad }),
      ...(evento.idParticipante && { id_participante: evento.idParticipante }),
    };

    try {
      if (opciones.modo === ModoRegistroAuditoria.SINCRONO)
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
          {
            ...accion,
            estado: estadoResultado?.(resultado) ?? EstadoAccion.EXITOSA,
          },
          { modo: ModoRegistroAuditoria.SINCRONO, tx },
        );
        return resultado;
      });
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : 500;
      await this.registrarIntento(
        ctx,
        accion,
        status === 401 || status === 403
          ? EstadoAccion.DENEGADA
          : EstadoAccion.FALLIDA,
      );
      throw error;
    }
  }

  async registrarIntento(
    ctx: ContextoAuditoria,
    accion: AccionAuditable,
    estado: Exclude<EstadoAccion, typeof EstadoAccion.EXITOSA>,
  ): Promise<void> {
    try {
      await this.bitacora.enTransaccion((tx) =>
        this.registrar(
          ctx,
          { ...accion, estado },
          { modo: ModoRegistroAuditoria.SINCRONO, tx },
        ),
      );
    } catch {
      this.logger.error(
        'No se pudo conservar el intento de una acción administrativa.',
      );
    }
  }
}
