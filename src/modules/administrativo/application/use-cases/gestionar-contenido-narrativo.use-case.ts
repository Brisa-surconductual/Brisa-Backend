import { Injectable } from '@nestjs/common';
import type {
  AccionContenidoNarrativo,
  CrearCapituloNarrativo,
  CrearLogroNarrativo,
  EditarCapituloNarrativo,
  EditarLogroNarrativo,
  GuardarReglaNivel,
  ResultadoCapituloNarrativo,
  ResultadoLogroNarrativo,
} from '../../domain/results/contenido-narrativo';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import type { ContextoGestionContenido } from '../../domain/results/contexto-gestion-contenido';
import { GestionContenidoException } from '../exceptions/gestion-contenido.exception';
import { ContenidoNarrativoPort } from '../ports/contenido-narrativo.port';
import { AuditoriaService } from '../services/auditoria.service';

type AccionCapitulo = Extract<AccionContenidoNarrativo, `${string}_CAPITULO`>;
type AccionLogro = Extract<AccionContenidoNarrativo, `${string}_LOGRO`>;

function hayCambio(
  entrada: EditarCapituloNarrativo | EditarLogroNarrativo,
): boolean {
  return Object.entries(entrada).some(
    ([campo, valor]) => campo !== 'justificacion_cambio' && valor !== undefined,
  );
}

@Injectable()
export class GestionarContenidoNarrativoUseCase {
  constructor(
    private readonly narrativa: ContenidoNarrativoPort,
    private readonly auditoria: AuditoriaService,
  ) {}

  listarCapitulos() {
    return this.narrativa.listarCapitulos();
  }

  crearCapitulo(
    ctx: ContextoGestionContenido,
    entrada: CrearCapituloNarrativo,
  ) {
    return this.gestionarCapitulo(
      ctx,
      'CREAR_CAPITULO',
      () => this.narrativa.crearCapitulo(ctx.idUsuario, entrada),
      entrada.justificacion_cambio,
    );
  }

  editarCapitulo(
    ctx: ContextoGestionContenido,
    id: string,
    entrada: EditarCapituloNarrativo,
  ) {
    if (!hayCambio(entrada))
      throw new GestionContenidoException('CAPITULO_INCOMPLETO');
    return this.gestionarCapitulo(
      ctx,
      'EDITAR_CAPITULO',
      () => this.narrativa.editarCapitulo(ctx.idUsuario, id, entrada),
      entrada.justificacion_cambio,
    );
  }

  publicarCapitulo(ctx: ContextoGestionContenido, id: string) {
    return this.gestionarCapitulo(ctx, 'PUBLICAR_CAPITULO', () =>
      this.narrativa.publicarCapitulo(ctx.idUsuario, id),
    );
  }

  inactivarCapitulo(ctx: ContextoGestionContenido, id: string) {
    return this.gestionarCapitulo(ctx, 'INACTIVAR_CAPITULO', () =>
      this.narrativa.inactivarCapitulo(ctx.idUsuario, id),
    );
  }

  listarLogros() {
    return this.narrativa.listarLogros();
  }

  crearLogro(ctx: ContextoGestionContenido, entrada: CrearLogroNarrativo) {
    return this.gestionarLogro(
      ctx,
      'CREAR_LOGRO',
      () => this.narrativa.crearLogro(ctx.idUsuario, entrada),
      entrada.justificacion_cambio,
    );
  }

  editarLogro(
    ctx: ContextoGestionContenido,
    id: string,
    entrada: EditarLogroNarrativo,
  ) {
    if (!hayCambio(entrada))
      throw new GestionContenidoException('LOGRO_INCOMPLETO');
    return this.gestionarLogro(
      ctx,
      'EDITAR_LOGRO',
      () => this.narrativa.editarLogro(ctx.idUsuario, id, entrada),
      entrada.justificacion_cambio,
    );
  }

  activarLogro(ctx: ContextoGestionContenido, id: string) {
    return this.gestionarLogro(ctx, 'ACTIVAR_LOGRO', () =>
      this.narrativa.activarLogro(ctx.idUsuario, id),
    );
  }

  inactivarLogro(ctx: ContextoGestionContenido, id: string) {
    return this.gestionarLogro(ctx, 'INACTIVAR_LOGRO', () =>
      this.narrativa.inactivarLogro(ctx.idUsuario, id),
    );
  }

  guardarRegla(
    ctx: ContextoGestionContenido,
    nivel: number,
    entrada: GuardarReglaNivel,
  ) {
    return this.auditoria.ejecutarDiferido(
      ctx,
      () => this.narrativa.guardarReglaNivel(ctx.idUsuario, nivel, entrada),
      () => ({
        accion: AccionAdministrativa.GESTION_CONTENIDO_NARRATIVO,
        recurso: RecursoAuditado.REGLA_NIVEL_NARRATIVO,
        detalle: {
          accion_solicitada: 'CONFIGURAR_REGLA_NIVEL',
          nivel_gamificacion: nivel,
          justificacion_cambio: entrada.justificacion_cambio,
        },
      }),
    );
  }

  consultarCobertura() {
    return this.narrativa.consultarCobertura();
  }

  private gestionarCapitulo(
    ctx: ContextoGestionContenido,
    accion: AccionCapitulo,
    operacion: () => Promise<ResultadoCapituloNarrativo>,
    justificacion?: string,
  ) {
    return this.auditoria.ejecutarDiferido(ctx, operacion, (resultado) => ({
      accion: AccionAdministrativa.GESTION_CONTENIDO_NARRATIVO,
      recurso: RecursoAuditado.CAPITULO_NARRATIVO,
      idRecurso: resultado.id_capitulo,
      detalle: {
        accion_solicitada: accion,
        justificacion_cambio: justificacion,
      },
    }));
  }

  private gestionarLogro(
    ctx: ContextoGestionContenido,
    accion: AccionLogro,
    operacion: () => Promise<ResultadoLogroNarrativo>,
    justificacion?: string,
  ) {
    return this.auditoria.ejecutarDiferido(ctx, operacion, (resultado) => ({
      accion: AccionAdministrativa.GESTION_CONTENIDO_NARRATIVO,
      recurso: RecursoAuditado.LOGRO_NARRATIVO,
      idRecurso: resultado.id_logro_narrativo,
      detalle: {
        accion_solicitada: accion,
        justificacion_cambio: justificacion,
      },
    }));
  }
}
