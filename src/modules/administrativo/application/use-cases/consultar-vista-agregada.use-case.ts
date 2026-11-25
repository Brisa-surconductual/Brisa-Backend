import { HttpException, Injectable } from '@nestjs/common';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { EstadoAccion } from '../../domain/enums/estado-accion.enum';
import { EstadoAgregacion } from '../../domain/enums/estado-agregacion.enum';
import { EstadoFuenteAgregada } from '../../domain/enums/estado-fuente-agregada.enum';
import { EstadoVistaAgregada } from '../../domain/enums/estado-vista-agregada.enum';
import { MotivoSinDatos } from '../../domain/enums/motivo-sin-datos.enum';
import type { TipoVistaAgregada } from '../../domain/enums/tipo-vista-agregada.enum';
import { VistasAgregadasRepository } from '../../domain/repositories/vistas-agregadas.repository';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import type {
  DatosVistaAgregada,
  VistaAgregada,
} from '../../domain/results/vista-agregada';
import { esSnapshotSuprimido } from '../../domain/value-objects/snapshot-agregado.vo';
import { CohorteActivaNoEncontradaException } from '../exceptions/cohorte-activa-no-encontrada.exception';
import { ConsultaVistaAgregadaException } from '../exceptions/consulta-vista-agregada.exception';
import { VistaAgregadaNoDisponibleException } from '../exceptions/vista-agregada-no-disponible.exception';
import { fuenteAgregadaNoDisponible } from '../ports/fuente-vista-agregada.port';
import type { FuenteVistaAgregada } from '../ports/fuente-vista-agregada.port';
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
          accion: AccionAdministrativa.CONSULTA_AGREGADA,
          recurso: definicion.recurso,
          idRecurso: idCohorte,
        },
        async (tx) => {
          if (
            !(await this.vistas.obtenerCronogramaCohorteActiva(tx, idCohorte))
          ) {
            throw new CohorteActivaNoEncontradaException(
              definicion.mensajeNoEncontrada,
            );
          }

          const resultado = await consultarFuenteConLimite(
            () => fuente.obtener(idCohorte),
            fuenteAgregadaNoDisponible(idCohorte),
          );
          if (resultado?.id_cohorte !== idCohorte)
            throw new ConsultaVistaAgregadaException(definicion.mensajeError);

          const vista: VistaAgregada<T> = {
            id_cohorte: idCohorte,
            estado: EstadoVistaAgregada.NO_DISPONIBLE,
            estado_agregacion: EstadoAgregacion.ACTUALIZADO,
            ultimo_timestamp_disponible: null,
            motivo_sin_datos: null,
            mensaje: null,
            datos: null,
          };

          switch (resultado.estado) {
            case EstadoFuenteAgregada.ACTUALIZADO: {
              let datos = definicion.proyectar(resultado.datos);
              if (!datos)
                throw new ConsultaVistaAgregadaException(
                  definicion.mensajeError,
                );
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
                  return {
                    ...vista,
                    motivo_sin_datos: MotivoSinDatos.AGREGADO_SUPRIMIDO,
                  };
                datos = definicion.proyectar(ultimo);
                if (!datos)
                  throw new ConsultaVistaAgregadaException(
                    definicion.mensajeError,
                  );
              }
              return {
                ...vista,
                estado: EstadoVistaAgregada.DISPONIBLE,
                ultimo_timestamp_disponible: new Date(
                  datos.fecha_actualizacion,
                ).toISOString(),
                datos,
              };
            }
            case EstadoFuenteAgregada.PENDIENTE:
              return {
                ...vista,
                estado: definicion.estadoPendiente ?? vista.estado,
                estado_agregacion: EstadoAgregacion.PENDIENTE,
                motivo_sin_datos: MotivoSinDatos.SIN_CONSOLIDAR,
                mensaje: definicion.mensajePendiente,
              };
            case EstadoFuenteAgregada.SUPRIMIDO:
              await this.vistas.suprimir(tx, idCohorte, definicion.tipo);
              return {
                ...vista,
                motivo_sin_datos: MotivoSinDatos.AGREGADO_SUPRIMIDO,
              };
            case EstadoFuenteAgregada.NO_DISPONIBLE: {
              const datos = definicion.proyectar(
                await this.vistas.obtenerUltimo(tx, idCohorte, definicion.tipo),
              );
              return {
                ...vista,
                estado: datos
                  ? EstadoVistaAgregada.DESACTUALIZADA
                  : EstadoVistaAgregada.NO_DISPONIBLE,
                estado_agregacion: EstadoAgregacion.ERROR_ACTUALIZACION,
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
              throw new ConsultaVistaAgregadaException(definicion.mensajeError);
          }
        },
        (respuesta) =>
          respuesta.estado_agregacion === EstadoAgregacion.ERROR_ACTUALIZACION
            ? EstadoAccion.FALLIDA
            : EstadoAccion.EXITOSA,
      );
      if (
        vista.estado_agregacion === EstadoAgregacion.ERROR_ACTUALIZACION &&
        !opciones.conservarVistaDegradada
      ) {
        throw new VistaAgregadaNoDisponibleException(vista);
      }
      return vista;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ConsultaVistaAgregadaException(definicion.mensajeError, error);
    }
  }
}
