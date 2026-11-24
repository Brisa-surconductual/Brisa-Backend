import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ContextoAuditoria } from '../../domain/auditoria';
import {
  esSnapshotSuprimido,
  proyectarDatosConductuales,
} from '../../domain/vista-conductual';
import type { VistaConductual } from '../../domain/vista-conductual';
import { SeguimientoAgregadoPort } from '../ports/seguimiento-agregado.port';
import type { ResultadoSeguimientoAgregado } from '../ports/seguimiento-agregado.port';
import { VistasConductualesRepository } from '../ports/vistas-conductuales.repository';
import { AuditoriaService } from '../services/auditoria.service';

const MENSAJE_PENDIENTE =
  'La cohorte activa no cuenta todavía con indicadores consolidados. La vista se mostrará cuando M05 complete su primer ciclo de consolidación.';
const MENSAJE_INDISPONIBLE =
  'El módulo de seguimiento no está disponible en este momento.';
const TIEMPO_LIMITE_M05_MS = 2_000;

function errorConsulta(cause?: unknown) {
  return new InternalServerErrorException(
    {
      statusCode: 500,
      codigo: 'ERROR_CONSULTA_VISTA_AGREGADA',
      mensaje:
        'No fue posible consultar la vista agregada de la cohorte activa en este momento. Intente nuevamente más tarde.',
    },
    { cause },
  );
}

@Injectable()
export class ConsultarVistaConductualUseCase {
  constructor(
    private readonly seguimiento: SeguimientoAgregadoPort,
    private readonly vistas: VistasConductualesRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  async ejecutar(
    ctx: ContextoAuditoria,
    idCohorte: string,
  ): Promise<VistaConductual> {
    try {
      return await this.auditoria.ejecutar(
        ctx,
        {
          accion: 'CONSULTA_AGREGADA',
          recurso: 'VISTA_AGREGADA_CONDUCTUAL',
          idRecurso: idCohorte,
        },
        async (tx) => {
          if (!(await this.vistas.bloquearCohorteActiva(tx, idCohorte))) {
            throw new NotFoundException({
              statusCode: 404,
              codigo: 'COHORTE_ACTIVA_NO_ENCONTRADA',
              mensaje:
                'No existe una cohorte activa disponible para mostrar la vista agregada.',
            });
          }

          const resultado = await this.consultarSeguimiento(idCohorte);
          if (resultado?.id_cohorte !== idCohorte) throw errorConsulta();

          const vista: VistaConductual = {
            id_cohorte: idCohorte,
            estado: 'NO_DISPONIBLE',
            estado_agregacion: 'ACTUALIZADO',
            ultimo_timestamp_disponible: null,
            motivo_sin_datos: null,
            mensaje: null,
            datos: null,
          };

          switch (resultado.estado) {
            case 'ACTUALIZADO': {
              let datos = proyectarDatosConductuales(resultado.datos);
              if (!datos) throw errorConsulta();
              if (!(await this.vistas.guardar(tx, idCohorte, datos))) {
                const ultimo = await this.vistas.obtenerUltimo(tx, idCohorte);
                if (esSnapshotSuprimido(ultimo))
                  return { ...vista, motivo_sin_datos: 'AGREGADO_SUPRIMIDO' };
                datos = proyectarDatosConductuales(ultimo);
                if (!datos) throw errorConsulta();
              }
              return {
                ...vista,
                estado: 'DISPONIBLE',
                ultimo_timestamp_disponible: new Date(
                  datos.fecha_actualizacion,
                ).toISOString(),
                datos,
              };
            }
            case 'PENDIENTE':
              return {
                ...vista,
                estado_agregacion: 'PENDIENTE',
                motivo_sin_datos: 'SIN_CONSOLIDAR',
                mensaje: MENSAJE_PENDIENTE,
              };
            case 'SUPRIMIDO':
              await this.vistas.suprimir(tx, idCohorte);
              return { ...vista, motivo_sin_datos: 'AGREGADO_SUPRIMIDO' };
            case 'NO_DISPONIBLE': {
              const datos = proyectarDatosConductuales(
                await this.vistas.obtenerUltimo(tx, idCohorte),
              );
              throw new ServiceUnavailableException({
                ...vista,
                estado: datos ? 'DESACTUALIZADA' : 'NO_DISPONIBLE',
                estado_agregacion: 'ERROR_ACTUALIZACION',
                ultimo_timestamp_disponible: datos
                  ? new Date(datos.fecha_actualizacion).toISOString()
                  : null,
                mensaje: datos
                  ? `${MENSAJE_INDISPONIBLE} Se muestra la última vista agregada disponible.`
                  : MENSAJE_INDISPONIBLE,
                datos,
              } satisfies VistaConductual);
            }
            default:
              throw errorConsulta();
          }
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw errorConsulta(error);
    }
  }

  private async consultarSeguimiento(
    idCohorte: string,
  ): Promise<ResultadoSeguimientoAgregado> {
    const indisponible: ResultadoSeguimientoAgregado = {
      id_cohorte: idCohorte,
      estado: 'NO_DISPONIBLE',
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const limite = new Promise<ResultadoSeguimientoAgregado>((resolve) => {
        timer = setTimeout(() => resolve(indisponible), TIEMPO_LIMITE_M05_MS);
      });
      return await Promise.race([this.seguimiento.obtener(idCohorte), limite]);
    } catch {
      return indisponible;
    } finally {
      clearTimeout(timer);
    }
  }
}
