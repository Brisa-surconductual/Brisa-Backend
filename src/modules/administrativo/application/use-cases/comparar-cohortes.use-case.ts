import { Injectable, Logger } from '@nestjs/common';
import { proyectarDatosConductuales } from '../../domain/entities/vistas-agregadas/vista-conductual.entity';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { EstadoAccion } from '../../domain/enums/estado-accion.enum';
import { EstadoFuenteAgregada } from '../../domain/enums/estado-fuente-agregada.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import { CohortesRepository } from '../../domain/repositories/cohortes.repository';
import type { CohorteConsultada } from '../../domain/results/cohorte-consultada';
import type {
  CohorteComparada,
  ConsultaComparacionCohortes,
} from '../../domain/results/comparacion-cohortes';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { ConsultaFiltradaException } from '../exceptions/consulta-filtrada.exception';
import { fuenteAgregadaNoDisponible } from '../ports/fuente-vista-agregada.port';
import { SeguimientoAgregadoPort } from '../ports/seguimiento-agregado.port';
import { separarFiltrosAgregados } from '../services/adaptar-filtros-agregados';
import { AuditoriaService } from '../services/auditoria.service';
import { consultarFuenteConLimite } from '../services/consultar-fuente-con-limite';

const MINIMO_POBLACION_VISIBLE = 5;

@Injectable()
export class CompararCohortesUseCase {
  private readonly logger = new Logger(CompararCohortesUseCase.name);

  constructor(
    private readonly cohortes: CohortesRepository,
    private readonly seguimiento: SeguimientoAgregadoPort,
    private readonly auditoria: AuditoriaService,
  ) {}

  async ejecutar(
    ctx: ContextoAuditoria,
    consulta: ConsultaComparacionCohortes,
  ) {
    const recurso = RecursoAuditado.COMPARACION_COHORTES;
    if (consulta.intentoExtraccion) {
      this.logger.warn({
        accion: AccionAdministrativa.INTENTO_EXTRACCION_RESTRINGIDA,
        id_usuario: ctx.idUsuario,
        id_cohortes: consulta.ids,
      });
      // Se conserva el intento aunque la comparación termine sin indicadores.
      await this.auditoria.ejecutar(
        ctx,
        {
          accion: AccionAdministrativa.INTENTO_EXTRACCION_RESTRINGIDA,
          recurso,
        },
        () => Promise.resolve(),
        () => EstadoAccion.DENEGADA,
      );
    }

    return this.auditoria.ejecutar(
      ctx,
      { accion: AccionAdministrativa.CONSULTA_AGREGADA, recurso },
      async (tx) => {
        const cohortes = await this.cohortes.consultarVigentes(
          tx,
          consulta.ids,
        );
        const porId = new Map(
          cohortes.map((cohorte) => [cohorte.id_cohorte, cohorte]),
        );
        const seleccion = consulta.ids.map((id) => {
          const cohorte = porId.get(id);
          if (!cohorte)
            throw new ConsultaFiltradaException('COHORTE_NO_ENCONTRADA');
          return cohorte;
        });
        const { filtros_omitidos } = separarFiltrosAgregados(
          consulta.filtros,
          this.seguimiento.filtrosSoportados,
        );
        const filas = await Promise.all(
          seleccion.map((cohorte) =>
            this.consultar(cohorte, consulta, filtros_omitidos.length === 0),
          ),
        );
        if (filas.every(({ disponibles }) => !disponibles))
          throw new ConsultaFiltradaException('COHORTES_SIN_INDICADORES');
        return {
          indicadores: consulta.indicadores,
          cohortes: filas.map(({ fila }) => fila),
        };
      },
    );
  }

  private async consultar(
    cohorte: CohorteConsultada,
    consulta: ConsultaComparacionCohortes,
    corteDisponible: boolean,
  ): Promise<{ disponibles: boolean; fila: CohorteComparada }> {
    const { id_cohorte, nombre_cohorte } = cohorte;
    const vacia = {
      id_cohorte,
      nombre_cohorte,
      n: null,
      suprimida: false,
      distribucion_niveles_progreso: null,
      tasa_adherencia_promedio: null,
      fecha_actualizacion: null,
    };
    if (!corteDisponible) return { disponibles: false, fila: vacia };

    const respuesta = await consultarFuenteConLimite(
      () =>
        this.seguimiento.obtener(id_cohorte, {
          filtros: consulta.filtros,
          incluirHistoricas: true,
        }),
      fuenteAgregadaNoDisponible(id_cohorte),
    );
    if (respuesta?.id_cohorte !== id_cohorte)
      return { disponibles: false, fila: vacia };
    if (respuesta.estado === EstadoFuenteAgregada.SUPRIMIDO)
      return { disponibles: true, fila: { ...vacia, suprimida: true } };
    if (respuesta.estado !== EstadoFuenteAgregada.ACTUALIZADO)
      return { disponibles: false, fila: vacia };

    const datos = proyectarDatosConductuales(respuesta.datos);
    if (datos === null) return { disponibles: false, fila: vacia };
    const n = datos.total_usuarios_activos;
    const progreso = consulta.indicadores.includes('PROGRESO')
      ? datos.distribucion_niveles_progreso
      : null;
    const adherencia = consulta.indicadores.includes('ADHERENCIA')
      ? datos.tasa_adherencia_promedio
      : null;
    if (
      progreso === null &&
      adherencia === null &&
      !(n !== null && n < MINIMO_POBLACION_VISIBLE)
    )
      return { disponibles: false, fila: vacia };

    const suprimida = n === null || n < MINIMO_POBLACION_VISIBLE;
    return {
      disponibles: true,
      fila: {
        id_cohorte,
        nombre_cohorte,
        n,
        suprimida,
        distribucion_niveles_progreso: suprimida
          ? null
          : (progreso?.map(({ nivel, total_usuarios }) => ({
              nivel,
              total: total_usuarios,
            })) ?? null),
        tasa_adherencia_promedio: suprimida ? null : adherencia,
        fecha_actualizacion: datos.fecha_actualizacion,
      },
    };
  }
}
