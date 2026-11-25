import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  accionExportacionCohorte,
  generarCsvCohorte,
} from '../../domain/entities/exportacion-cohorte/exportacion-cohorte.entity';
import { EstadoAccion } from '../../domain/enums/estado-accion.enum';
import { EstadoAgregacion } from '../../domain/enums/estado-agregacion.enum';
import { CohortesRepository } from '../../domain/repositories/cohortes.repository';
import { VistasAgregadasRepository } from '../../domain/repositories/vistas-agregadas.repository';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { nombreArchivoCohorte } from '../../domain/value-objects/nombre-archivo-exportacion.vo';
import { ExportacionCsvException } from '../exceptions/exportacion-csv.exception';
import { RegistroAuditoriaException } from '../exceptions/registro-auditoria.exception';
import { BitacoraRepository } from '../ports/auditoria.port';
import { AuditoriaService } from '../services/auditoria.service';
import { ConsultarVistaConductualUseCase } from './consultar-vista-conductual.use-case';
import { ConsultarVistaNotificacionesUseCase } from './consultar-vista-notificaciones.use-case';

@Injectable()
export class ExportarIndicadoresCohorteUseCase {
  private readonly logger = new Logger(ExportarIndicadoresCohorteUseCase.name);

  constructor(
    private readonly cohortes: CohortesRepository,
    private readonly vistas: VistasAgregadasRepository,
    private readonly conductual: ConsultarVistaConductualUseCase,
    private readonly notificaciones: ConsultarVistaNotificacionesUseCase,
    private readonly auditoria: AuditoriaService,
    private readonly bitacora: BitacoraRepository,
  ) {}

  async ejecutar(
    ctx: ContextoAuditoria,
    idCohorte: string,
    intentoPii: boolean,
  ) {
    if (intentoPii) {
      this.logger.warn(
        `ALERTA: Intento de solicitar columnas con PII en exportación CSV. Usuario: ${ctx.idUsuario}, Cohorte: ${idCohorte}. Petición sanitizada.`,
      );
    }

    const accion = accionExportacionCohorte(idCohorte);
    let registrandoExportacion = false;
    try {
      await this.bitacora.enTransaccion((tx) =>
        this.verificarCohorteActiva(tx, idCohorte),
      );
      const { conductual, notificaciones } = await this.consultarVistas(
        ctx,
        idCohorte,
      );

      registrandoExportacion = true;
      return await this.auditoria.ejecutar(ctx, accion, async (tx) => {
        await this.verificarCohorteActiva(tx, idCohorte);
        const [cohorte] = await this.cohortes.consultarVigentes(tx, idCohorte);
        if (!cohorte) throw new ExportacionCsvException('COHORTE_NO_ACTIVA');

        const nombre = nombreArchivoCohorte();
        const contenido = Buffer.from(
          generarCsvCohorte(cohorte.nombre_cohorte, conductual, notificaciones),
          'utf8',
        );
        accion.detalle = {
          nombre_archivo: nombre,
          tamano_bytes: contenido.length,
        };
        return { nombre, contenido };
      });
    } catch (error) {
      if (!registrandoExportacion)
        await this.auditoria.registrarIntento(
          ctx,
          accion,
          EstadoAccion.FALLIDA,
        );
      if (
        error instanceof RegistroAuditoriaException ||
        (error instanceof HttpException && error.getStatus() === 422)
      )
        throw error;
      throw new ExportacionCsvException('ERROR_GENERACION_CSV', error);
    }
  }

  private async verificarCohorteActiva(
    tx: Prisma.TransactionClient,
    idCohorte: string,
  ) {
    if (!(await this.vistas.obtenerCronogramaCohorteActiva(tx, idCohorte)))
      throw new ExportacionCsvException('COHORTE_NO_ACTIVA');
  }

  private async consultarVistas(ctx: ContextoAuditoria, idCohorte: string) {
    const opciones = { conservarVistaDegradada: true };
    const [conductual, notificaciones] = await Promise.allSettled([
      this.conductual.ejecutar(ctx, idCohorte, opciones),
      this.notificaciones.ejecutar(ctx, idCohorte, opciones),
    ]);
    for (const vista of [conductual, notificaciones]) {
      if (
        vista.status === 'rejected' &&
        vista.reason instanceof RegistroAuditoriaException
      )
        throw vista.reason;
    }
    if (conductual.status === 'rejected') {
      if (conductual.reason instanceof NotFoundException)
        throw new ExportacionCsvException('COHORTE_NO_ACTIVA');
      throw new ExportacionCsvException('ERROR_GENERACION_CSV');
    }
    const vista = conductual.value;
    if (!vista.datos) {
      if (vista.estado_agregacion === EstadoAgregacion.ERROR_ACTUALIZACION)
        throw new ExportacionCsvException('ERROR_GENERACION_CSV');
      throw new ExportacionCsvException('SIN_INDICADORES_CONSOLIDADOS');
    }

    return {
      conductual: { ...vista, datos: vista.datos },
      notificaciones:
        notificaciones.status === 'fulfilled' ? notificaciones.value : null,
    };
  }
}
