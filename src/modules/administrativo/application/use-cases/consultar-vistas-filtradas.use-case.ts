import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { CronogramaPort } from '../../../cronograma/application/ports/cronograma.port';
import { proyectarDatosConductuales } from '../../domain/entities/vistas-agregadas/vista-conductual.entity';
import { proyectarDatosNarrativos } from '../../domain/entities/vistas-agregadas/vista-narrativa.entity';
import { proyectarDatosNotificaciones } from '../../domain/entities/vistas-agregadas/vista-notificaciones.entity';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { EstadoAccion } from '../../domain/enums/estado-accion.enum';
import { EstadoAgregacion } from '../../domain/enums/estado-agregacion.enum';
import { EstadoFuenteAgregada } from '../../domain/enums/estado-fuente-agregada.enum';
import { EstadoVistaAgregada } from '../../domain/enums/estado-vista-agregada.enum';
import { MotivoSinDatos } from '../../domain/enums/motivo-sin-datos.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import { TipoVistaAgregada } from '../../domain/enums/tipo-vista-agregada.enum';
import { VistasAgregadasRepository } from '../../domain/repositories/vistas-agregadas.repository';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import type {
  CampoFiltroAgregado,
  FiltrosAgregados,
  FiltrosPorVista,
  ObjetivoVistaAgregada,
  VistaFiltrada,
  VistasFiltradas,
} from '../../domain/results/filtros-agregados';
import type { DatosVistaAgregada } from '../../domain/results/vista-agregada';
import { CohorteActivaNoEncontradaException } from '../exceptions/cohorte-activa-no-encontrada.exception';
import { ConsultaFiltradaException } from '../exceptions/consulta-filtrada.exception';
import { VistaAgregadaNoDisponibleException } from '../exceptions/vista-agregada-no-disponible.exception';
import {
  fuenteAgregadaNoDisponible,
  type FuenteVistaAgregada,
} from '../ports/fuente-vista-agregada.port';
import { NarrativaAgregadaPort } from '../ports/narrativa-agregada.port';
import { NotificacionesAgregadasPort } from '../ports/notificaciones-agregadas.port';
import { SeguimientoAgregadoPort } from '../ports/seguimiento-agregado.port';
import { separarFiltrosAgregados } from '../services/adaptar-filtros-agregados';
import { AuditoriaService } from '../services/auditoria.service';
import { consultarFuenteConLimite } from '../services/consultar-fuente-con-limite';
import { resolverSnapshotAgregado } from '../services/resolver-snapshot-agregado';

interface AdaptadorVista {
  fuente: FuenteVistaAgregada;
  recurso: RecursoAuditado;
  nombre: string;
  proyectar: (datos: unknown) => DatosVistaAgregada | null;
}

const NOMBRES_FILTRO: Record<CampoFiltroAgregado, string> = {
  fecha_inicio: 'fecha de inicio',
  fecha_fin: 'fecha de fin',
  id_unidad_temporal: 'unidad temporal',
  modalidad_terapeutica: 'modalidad terapéutica',
};

@Injectable()
export class ConsultarVistasFiltradasUseCase {
  private readonly adaptadores: Record<TipoVistaAgregada, AdaptadorVista>;

  constructor(
    private readonly repositorio: VistasAgregadasRepository,
    private readonly cronograma: CronogramaPort,
    private readonly auditoria: AuditoriaService,
    seguimiento: SeguimientoAgregadoPort,
    narrativa: NarrativaAgregadaPort,
    notificaciones: NotificacionesAgregadasPort,
  ) {
    this.adaptadores = {
      CONDUCTUAL: {
        fuente: seguimiento,
        recurso: RecursoAuditado.VISTA_AGREGADA_CONDUCTUAL,
        nombre: 'conductual',
        proyectar: proyectarDatosConductuales,
      },
      NARRATIVA: {
        fuente: narrativa,
        recurso: RecursoAuditado.VISTA_AGREGADA_NARRATIVA,
        nombre: 'narrativa',
        proyectar: proyectarDatosNarrativos,
      },
      NOTIFICACIONES: {
        fuente: notificaciones,
        recurso: RecursoAuditado.VISTA_AGREGADA_NOTIFICACIONES,
        nombre: 'de notificaciones',
        proyectar: proyectarDatosNotificaciones,
      },
    };
  }

  async ejecutar(
    ctx: ContextoAuditoria,
    id: string,
    filtros: FiltrosAgregados,
    objetivo: ObjetivoVistaAgregada,
  ): Promise<VistasFiltradas> {
    if (objetivo !== 'TODAS') {
      const vista = await this.consultarIndividual(ctx, id, filtros, objetivo);
      return { filtros_aplicados: filtros, vistas: { [objetivo]: vista } };
    }

    return this.auditoria.ejecutar(
      ctx,
      {
        accion: AccionAdministrativa.CONSULTA_AGREGADA,
        recurso: RecursoAuditado.VISTAS_AGREGADAS_COHORTE,
        idRecurso: id,
      },
      async (tx) => {
        await this.validarCronograma(tx, id, filtros);
        const tipos = Object.values(TipoVistaAgregada);
        const resultados = await Promise.allSettled(
          tipos.map((tipo) => this.consultarVista(tx, id, filtros, tipo)),
        );
        const vistas: VistasFiltradas['vistas'] = {};
        for (const [indice, resultado] of resultados.entries()) {
          const tipo = tipos[indice];
          vistas[tipo] =
            resultado.status === 'fulfilled'
              ? resultado.value
              : this.vistaSinDatos(id, filtros, tipo, {
                  estado_agregacion: EstadoAgregacion.ERROR_ACTUALIZACION,
                  mensaje:
                    'No fue posible aplicar el filtro de esta vista en este momento.',
                });
        }
        return { filtros_aplicados: filtros, vistas };
      },
      ({ vistas }) =>
        Object.values(vistas).every(
          (vista) =>
            vista.estado_agregacion === EstadoAgregacion.ERROR_ACTUALIZACION,
        )
          ? EstadoAccion.FALLIDA
          : EstadoAccion.EXITOSA,
    );
  }

  async consultarIndividual(
    ctx: ContextoAuditoria,
    id: string,
    filtros: FiltrosAgregados,
    tipo: TipoVistaAgregada,
  ): Promise<VistaFiltrada> {
    const vista = await this.auditoria.ejecutar(
      ctx,
      {
        accion: AccionAdministrativa.CONSULTA_AGREGADA,
        recurso: this.adaptadores[tipo].recurso,
        idRecurso: id,
      },
      async (tx) => {
        await this.validarCronograma(tx, id, filtros);
        return this.consultarVista(tx, id, filtros, tipo);
      },
      (respuesta) =>
        respuesta.estado_agregacion === EstadoAgregacion.ERROR_ACTUALIZACION
          ? EstadoAccion.FALLIDA
          : EstadoAccion.EXITOSA,
    );
    if (vista.estado_agregacion === EstadoAgregacion.ERROR_ACTUALIZACION)
      throw new VistaAgregadaNoDisponibleException(vista);
    return vista;
  }

  private async validarCronograma(
    tx: Prisma.TransactionClient,
    id: string,
    filtros: FiltrosAgregados,
  ) {
    const idCronograma = await this.repositorio.obtenerCronogramaCohorteActiva(
      tx,
      id,
    );
    if (!idCronograma)
      throw new CohorteActivaNoEncontradaException(
        'No existe una cohorte activa disponible para consultar las vistas agregadas.',
      );
    if (
      filtros.id_unidad_temporal &&
      !(
        await this.cronograma.listarIdsUnidadesEnOrden(tx, idCronograma)
      ).includes(filtros.id_unidad_temporal)
    )
      throw new ConsultaFiltradaException('UNIDAD_TEMPORAL_NO_ENCONTRADA');
  }

  private async consultarVista(
    tx: Prisma.TransactionClient,
    id: string,
    filtros: FiltrosAgregados,
    tipo: TipoVistaAgregada,
  ): Promise<VistaFiltrada> {
    const { fuente, nombre, proyectar } = this.adaptadores[tipo];
    const vista = this.vistaSinDatos(id, filtros, tipo);
    const filtrada = Object.keys(filtros).length > 0;
    const aplicoFiltros = Object.keys(vista.filtros_aplicados).length > 0;
    const respuesta = await consultarFuenteConLimite(
      () =>
        filtrada
          ? fuente.obtener(id, { filtros: vista.filtros_aplicados })
          : fuente.obtener(id),
      fuenteAgregadaNoDisponible(id),
    );
    if (respuesta?.id_cohorte !== id)
      throw new ConsultaFiltradaException('ERROR_CONSULTA_FILTRADA');

    switch (respuesta.estado) {
      case EstadoFuenteAgregada.ACTUALIZADO: {
        let datos = proyectar(respuesta.datos);
        if (!datos)
          throw new ConsultaFiltradaException('ERROR_CONSULTA_FILTRADA');
        if (!filtrada) {
          const snapshot = await resolverSnapshotAgregado(
            this.repositorio,
            tx,
            id,
            tipo,
            datos,
            proyectar,
          );
          if (snapshot.suprimido)
            return {
              ...vista,
              motivo_sin_datos: MotivoSinDatos.AGREGADO_SUPRIMIDO,
            };
          datos = snapshot.datos;
          if (!datos)
            throw new ConsultaFiltradaException('ERROR_CONSULTA_FILTRADA');
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
          estado:
            aplicoFiltros || tipo === TipoVistaAgregada.NOTIFICACIONES
              ? EstadoVistaAgregada.DISPONIBLE
              : vista.estado,
          estado_agregacion: EstadoAgregacion.PENDIENTE,
          motivo_sin_datos: MotivoSinDatos.SIN_CONSOLIDAR,
          mensaje: aplicoFiltros
            ? 'No se encontraron datos agregados para la combinación de filtros seleccionada.'
            : 'La cohorte activa no cuenta todavía con indicadores consolidados para esta vista.',
        };
      case EstadoFuenteAgregada.SUPRIMIDO:
        if (!filtrada) await this.repositorio.suprimir(tx, id, tipo);
        return {
          ...vista,
          motivo_sin_datos: MotivoSinDatos.AGREGADO_SUPRIMIDO,
        };
      case EstadoFuenteAgregada.NO_DISPONIBLE: {
        // Los respaldos se identifican por cohorte y vista, sin las dimensiones de RF-135.
        const datos = filtrada
          ? null
          : proyectar(await this.repositorio.obtenerUltimo(tx, id, tipo));
        return {
          ...vista,
          estado: datos
            ? EstadoVistaAgregada.DESACTUALIZADA
            : EstadoVistaAgregada.NO_DISPONIBLE,
          estado_agregacion: EstadoAgregacion.ERROR_ACTUALIZACION,
          ultimo_timestamp_disponible: datos
            ? new Date(datos.fecha_actualizacion).toISOString()
            : null,
          mensaje: `El módulo de origen de la vista ${nombre} no está disponible en este momento.`,
          datos,
        };
      }
      default:
        throw new ConsultaFiltradaException('ERROR_CONSULTA_FILTRADA');
    }
  }

  private vistaSinDatos(
    id: string,
    filtros: FiltrosAgregados,
    tipo: TipoVistaAgregada,
    cambios: Partial<VistaFiltrada> = {},
  ): VistaFiltrada {
    return {
      id_cohorte: id,
      estado: EstadoVistaAgregada.NO_DISPONIBLE,
      estado_agregacion: EstadoAgregacion.ACTUALIZADO,
      ultimo_timestamp_disponible: null,
      motivo_sin_datos: null,
      mensaje: null,
      datos: null,
      ...this.adaptar(filtros, tipo),
      ...cambios,
    };
  }

  private adaptar(
    filtros: FiltrosAgregados,
    tipo: TipoVistaAgregada,
  ): FiltrosPorVista {
    const adaptador = this.adaptadores[tipo];
    const resultado = separarFiltrosAgregados(
      filtros,
      adaptador.fuente.filtrosSoportados,
    );
    const omitidos = resultado.filtros_omitidos.map(
      (campo) => NOMBRES_FILTRO[campo],
    );
    if (!omitidos.length) return resultado;

    const filtrosOmitidos =
      omitidos.length === 1
        ? `El filtro de ${omitidos[0]} no está disponible`
        : `Los filtros de ${omitidos.join(', ')} no están disponibles`;
    return {
      ...resultado,
      advertencia: `${filtrosOmitidos} para la vista ${adaptador.nombre}.`,
    };
  }
}
