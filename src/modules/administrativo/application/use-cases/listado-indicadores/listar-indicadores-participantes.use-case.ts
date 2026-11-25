import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import { EstadoAccion } from '../../../domain/enums/estado-accion.enum';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeveridadAuditoria } from '../../../domain/enums/severidad-auditoria.enum';
import {
  filtrarIndicadores,
  ordenarIndicadores,
  paginar,
} from '../../../domain/policies/listado-indicadores.policy';
import { ParticipantesCohorteRepository } from '../../../domain/repositories/participantes-cohorte.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type {
  FiltrosListadoIndicadores,
  IndicadoresParticipanteListado,
  OrdenListadoIndicadores,
  PaginaListado,
} from '../../../domain/results/listado-indicadores';
import {
  type ListadoIndicadoresDtoResponse,
  MENSAJE_COHORTE_SIN_PARTICIPANTES,
} from '../../dto/listado-indicadores/listado-indicadores.dto-response';
import { ListadoIndicadoresException } from '../../exceptions/listado-indicadores.exception';
import {
  type IndicadoresParticipanteM05,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';

const M05_NO_DISPONIBLE = Symbol('m05-no-disponible');

export interface ConsultaListadoIndicadores {
  filtros: FiltrosListadoIndicadores;
  orden: OrdenListadoIndicadores;
  pagina: PaginaListado;
  /** Parámetros restringidos que llegaron y se descartaron (RF-142 FA3). */
  camposRestringidos: string[];
}

/**
 * RF-142: listado de los participantes ACTIVO de una cohorte con su nivel de
 * progreso, adherencia y alertas, filtrado, ordenado y paginado en el back.
 *
 * Sin N+1: una consulta de membresías, una llamada por lote a M05 y una
 * consulta a `alertas_gestion_admin`, sin importar el tamaño de la cohorte.
 * No exige permiso individual: solo expone seudónimos e indicadores, nunca
 * correo ni texto de diario o chat. Abrir la ficha de un participante sí lo
 * exige (RF-128).
 */
@Injectable()
export class ListarIndicadoresParticipantesUseCase {
  private readonly logger = new Logger(
    ListarIndicadoresParticipantesUseCase.name,
  );

  constructor(
    private readonly participantesCohorte: ParticipantesCohorteRepository,
    private readonly seguimiento: SeguimientoIndividualPort,
    private readonly reglas: SeguimientoIndividualService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async execute(
    ctx: ContextoAuditoria,
    idCohorte: string,
    consulta: ConsultaListadoIndicadores,
  ): Promise<ListadoIndicadoresDtoResponse> {
    if (consulta.camposRestringidos.length > 0)
      await this.registrarIntentoExtraccion(
        ctx,
        idCohorte,
        consulta.camposRestringidos,
      );

    const accion: AccionAuditable = {
      accion: AccionAdministrativa.CONSULTA_PARTICIPANTE,
      recurso: RecursoAuditado.INDICADORES_PARTICIPANTES_COHORTE,
      idRecurso: idCohorte,
      severidad: SeveridadAuditoria.MEDIA,
      detalle: {
        consulta: 'LISTADO_INDICADORES',
        filtros: {
          ...consulta.filtros,
          orden_campo: consulta.orden.campo,
          orden_direccion: consulta.orden.direccion,
          offset: consulta.pagina.offset,
          limit: consulta.pagina.limit,
        },
      },
    };

    try {
      return await this.auditoria.ejecutar(ctx, accion, async (tx) => {
        const estado = await this.participantesCohorte.estadoCohorte(
          tx,
          idCohorte,
          false,
        );
        if (!estado)
          throw new ListadoIndicadoresException('COHORTE_NO_ENCONTRADA');

        const miembros = await this.participantesCohorte.listarActivos(
          tx,
          idCohorte,
        );
        const { offset, limit } = consulta.pagina;
        if (miembros.length === 0)
          return {
            items: [],
            total: 0,
            offset,
            limit,
            mensaje: MENSAJE_COHORTE_SIN_PARTICIPANTES,
          };

        const lote = await consultarFuenteConLimite<
          IndicadoresParticipanteM05[] | typeof M05_NO_DISPONIBLE
        >(
          () =>
            this.seguimiento.obtenerIndicadoresLote(
              miembros.map((miembro) => miembro.codigo_participante),
            ),
          M05_NO_DISPONIBLE,
        );
        if (lote === M05_NO_DISPONIBLE)
          throw new ListadoIndicadoresException('M05_NO_DISPONIBLE');

        const porCodigo = this.aislarPorParticipante(
          lote,
          miembros.map((miembro) => miembro.codigo_participante),
        );
        const alertas = await this.reglas.clasificarAlertasLote(
          tx,
          miembros.map((miembro) => ({
            id_participante: miembro.id_usuario,
            alertas:
              porCodigo.get(miembro.codigo_participante)?.alertas_activas ?? [],
          })),
        );

        // Lista blanca explícita: nunca se esparce lo que devuelve M05.
        const filas: IndicadoresParticipanteListado[] = miembros.map(
          ({ id_usuario, codigo_participante }) => {
            const indicadores = porCodigo.get(codigo_participante);
            const clasificadas = alertas.get(id_usuario);
            const noAtendidas = clasificadas?.no_atendidas ?? [];
            return {
              codigo_participante,
              nivel_progreso: indicadores?.nivel_progreso ?? null,
              tasa_adherencia: indicadores?.tasa_adherencia ?? null,
              alertas_activas: noAtendidas.length,
              alertas_atendidas: clasificadas?.atendidas.length ?? 0,
              tipos_alerta_activa: [
                ...new Set(noAtendidas.map((alerta) => alerta.tipo_alerta)),
              ],
            };
          },
        );

        const { items, total } = paginar(
          ordenarIndicadores(
            filtrarIndicadores(filas, consulta.filtros),
            consulta.orden,
          ),
          consulta.pagina,
        );
        return { items, total, offset, limit };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ListadoIndicadoresException('ERROR_LISTADO_INDICADORES', {
        cause: error,
      });
    }
  }

  /**
   * Aislamiento por participante: solo se aceptan filas de M05 de códigos
   * pedidos, una por código. Cualquier otra se descarta y se deja constancia.
   */
  private aislarPorParticipante(
    lote: IndicadoresParticipanteM05[],
    codigosPedidos: string[],
  ): Map<string, IndicadoresParticipanteM05> {
    const pedidos = new Set(codigosPedidos);
    const porCodigo = new Map<string, IndicadoresParticipanteM05>();
    let descartadas = 0;
    for (const fila of lote) {
      const codigo = fila.codigo_participante;
      if (!pedidos.has(codigo) || porCodigo.has(codigo)) descartadas++;
      else porCodigo.set(codigo, fila);
    }
    if (descartadas > 0)
      this.logger.warn(
        `M05 devolvió ${descartadas} fila(s) de indicadores ajenas o repetidas; se descartaron.`,
      );
    return porCodigo;
  }

  /** RF-142 FA3: log de seguridad y bitácora; la consulta sigue con 200. */
  private async registrarIntentoExtraccion(
    ctx: ContextoAuditoria,
    idCohorte: string,
    campos: string[],
  ): Promise<void> {
    this.logger.warn(
      `ALERTA: Intento de extracción de campos restringidos (diario/chat) detectado. Usuario: ${ctx.idUsuario ?? 'desconocido'}, IP: ${ctx.direccionIp}, Cohorte: ${idCohorte}.`,
    );
    await this.auditoria.registrarIntento(
      ctx,
      {
        accion: AccionAdministrativa.INTENTO_EXTRACCION_RESTRINGIDA,
        recurso: RecursoAuditado.INDICADORES_PARTICIPANTES_COHORTE,
        idRecurso: idCohorte,
        severidad: SeveridadAuditoria.ALTA,
        detalle: { campos_descartados: campos },
      },
      EstadoAccion.DENEGADA,
    );
  }
}
