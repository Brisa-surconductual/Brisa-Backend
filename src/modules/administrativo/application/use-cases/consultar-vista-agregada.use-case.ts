import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ContextoAuditoria } from '../../domain/auditoria';
import { esSnapshotSuprimido } from '../../domain/vista-agregada';
import type {
  DatosVistaAgregada,
  TipoVistaAgregada,
  VistaAgregada,
} from '../../domain/vista-agregada';
import { fuenteAgregadaNoDisponible } from '../ports/fuente-vista-agregada.port';
import type { FuenteVistaAgregada } from '../ports/fuente-vista-agregada.port';
import { VistasAgregadasRepository } from '../ports/vistas-agregadas.repository';
import { AuditoriaService } from '../services/auditoria.service';
import { consultarFuenteConLimite } from '../services/consultar-fuente-con-limite';

interface DefinicionVista<T extends DatosVistaAgregada> {
  tipo: TipoVistaAgregada;
  recurso: string;
  mensajeNoEncontrada: string;
  mensajeError: string;
  mensajePendiente: string;
  mensajeIndisponible: string;
  estadoPendiente?: VistaAgregada<T>['estado'];
  proyectar(valor: unknown): T | null;
}

export interface OpcionesConsultaAgregada {
  conservarVistaDegradada?: boolean;
}

function errorConsulta(mensaje: string, cause?: unknown) {
  return new InternalServerErrorException(
    {
      statusCode: 500,
      codigo: 'ERROR_CONSULTA_VISTA_AGREGADA',
      mensaje,
    },
    { cause },
  );
}

@Injectable()
export class ConsultarVistaAgregadaUseCase {
  constructor(
    private readonly vistas: VistasAgregadasRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  async ejecutar<T extends DatosVistaAgregada>(
    ctx: ContextoAuditoria,
    idCohorte: string,
    fuente: FuenteVistaAgregada,
    definicion: DefinicionVista<T>,
    opciones: OpcionesConsultaAgregada = {},
  ): Promise<VistaAgregada<T>> {
    try {
      const vista = await this.auditoria.ejecutar<VistaAgregada<T>>(
        ctx,
        {
          accion: 'CONSULTA_AGREGADA',
          recurso: definicion.recurso,
          idRecurso: idCohorte,
        },
        async (tx) => {
          if (
            !(await this.vistas.obtenerCronogramaCohorteActiva(tx, idCohorte))
          ) {
            throw new NotFoundException({
              statusCode: 404,
              codigo: 'COHORTE_ACTIVA_NO_ENCONTRADA',
              mensaje: definicion.mensajeNoEncontrada,
            });
          }

          const resultado = await consultarFuenteConLimite(
            () => fuente.obtener(idCohorte),
            fuenteAgregadaNoDisponible(idCohorte),
          );
          if (resultado?.id_cohorte !== idCohorte)
            throw errorConsulta(definicion.mensajeError);

          const vista: VistaAgregada<T> = {
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
              let datos = definicion.proyectar(resultado.datos);
              if (!datos) throw errorConsulta(definicion.mensajeError);
              if (
                !(await this.vistas.guardar(
                  tx,
                  idCohorte,
                  definicion.tipo,
                  datos,
                ))
              ) {
                const ultimo = await this.vistas.obtenerUltimo(
                  tx,
                  idCohorte,
                  definicion.tipo,
                );
                if (esSnapshotSuprimido(ultimo))
                  return { ...vista, motivo_sin_datos: 'AGREGADO_SUPRIMIDO' };
                datos = definicion.proyectar(ultimo);
                if (!datos) throw errorConsulta(definicion.mensajeError);
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
                estado: definicion.estadoPendiente ?? vista.estado,
                estado_agregacion: 'PENDIENTE',
                motivo_sin_datos: 'SIN_CONSOLIDAR',
                mensaje: definicion.mensajePendiente,
              };
            case 'SUPRIMIDO':
              await this.vistas.suprimir(tx, idCohorte, definicion.tipo);
              return { ...vista, motivo_sin_datos: 'AGREGADO_SUPRIMIDO' };
            case 'NO_DISPONIBLE': {
              const datos = definicion.proyectar(
                await this.vistas.obtenerUltimo(tx, idCohorte, definicion.tipo),
              );
              return {
                ...vista,
                estado: datos ? 'DESACTUALIZADA' : 'NO_DISPONIBLE',
                estado_agregacion: 'ERROR_ACTUALIZACION',
                ultimo_timestamp_disponible: datos
                  ? new Date(datos.fecha_actualizacion).toISOString()
                  : null,
                mensaje: datos
                  ? `${definicion.mensajeIndisponible} Se muestra la última vista agregada disponible.`
                  : definicion.mensajeIndisponible,
                datos,
              };
            }
            default:
              throw errorConsulta(definicion.mensajeError);
          }
        },
        (respuesta) =>
          respuesta.estado_agregacion === 'ERROR_ACTUALIZACION'
            ? 'FALLIDA'
            : 'EXITOSA',
      );
      if (
        vista.estado_agregacion === 'ERROR_ACTUALIZACION' &&
        !opciones.conservarVistaDegradada
      ) {
        throw new ServiceUnavailableException(vista);
      }
      return vista;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw errorConsulta(definicion.mensajeError, error);
    }
  }
}
