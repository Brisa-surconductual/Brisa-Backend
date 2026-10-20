import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CalcularUbicacionTemporalUsuarioUseCase } from '../../../cronograma/application/use-cases/cronograma/calcular-ubicacion-temporal-usuario.use-case';
import { UbicacionTemporalUsuarioDtoResponse } from '../../../cronograma/application/dto/cronograma/ubicacion-temporal-usuario.dto-response';
import {
  FlujoConversacional,
  NodoConversacional,
} from '../../domain/entities/arbol-conversacional.entity';
import { ModalidadConversacional } from '../../domain/enums/arbol-conversacional.enums';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import {
  DatosNuevaSesionConversacional,
  ResultadoInicioSesionConversacional,
  SesionConversacional,
  SesionConversacionalRepository,
} from '../../domain/repositories/sesion-conversacional.repository';
import { DeterminarContextoConversacionalUseCase } from './determinar-contexto-conversacional.use-case';
import { PerfilClinicoIncompletoException } from '../../domain/exeption/contexto-conversacional.exceptions';
import { AsignacionCronogramaChatRepository } from '../../domain/repositories/asignacion-cronograma-chat.repository';

export interface InicioSesionConversacionalResponse {
  reanudada: boolean;
  sesion: {
    id_sesion: string;
    id_flujo_conversacional: string;
    version_arbol_utilizada: number;
    modalidad_activa: SesionConversacional['modalidadActiva'];
    tipo_dependencia: SesionConversacional['tipoDependencia'];
    tipo_craving: SesionConversacional['tipoCraving'];
    estado_actual: SesionConversacional['estadoActual'];
    fecha_inicio: Date;
    fecha_ultima_interaccion: Date;
  };
  nodo_actual: {
    id_nodo: string;
    tipo_nodo: string;
    contenido: Record<string, unknown>;
    es_nodo_inicial: boolean;
    orden: number | null;
  };
  ubicacion_temporal: {
    id_unidad_temporal: string | null;
    nombre_unidad: string | null;
    finalizado_programa: boolean;
  };
}

@Injectable()
export class IniciarOReanudarSesionUseCase {
  constructor(
    private readonly sesiones: SesionConversacionalRepository,
    private readonly arboles: ArbolConversacionalRepository,
    private readonly determinarContexto: DeterminarContextoConversacionalUseCase,
    private readonly calcularUbicacion: CalcularUbicacionTemporalUsuarioUseCase,
    private readonly asignacionCronograma: AsignacionCronogramaChatRepository,
  ) {}

  async execute(
    idUsuario: string,
  ): Promise<InicioSesionConversacionalResponse> {
    const existente = await this.sesiones.buscarUltimaReanudable(idUsuario);

    const tieneCronograma =
      await this.asignacionCronograma.existeAsignacion(idUsuario);

    if (!tieneCronograma) {
      throw new UnprocessableEntityException({
        codigo: 'SIN_CRONOGRAMA',
        mensaje: 'El usuario no tiene un cronograma asignado.',
      });
    }

    const ubicacion = await this.calcularUbicacion.execute(idUsuario);

    if (existente !== null) {
      const resultado = await this.sesiones.iniciarOReanudar(
        this.datosDesdeSesionExistente(existente),
      );

      return this.construirRespuesta(resultado, ubicacion);
    }

    let contexto: Awaited<
      ReturnType<DeterminarContextoConversacionalUseCase['execute']>
    >;

    try {
      contexto = await this.determinarContexto.execute(idUsuario);
    } catch (error: unknown) {
      if (error instanceof PerfilClinicoIncompletoException) {
        throw new ConflictException({
          codigo: 'PERFIL_INCOMPLETO',
          mensaje: 'El usuario no tiene un perfil clínico completo.',
        });
      }

      throw error;
    }

    let flujo: FlujoConversacional | null;

    if (contexto.modalidad === ModalidadConversacional.GRUPAL) {
      flujo = await this.arboles.buscarPublicadoGrupal();
    } else {
      if (contexto.perfil === null) {
        throw new ConflictException({
          codigo: 'PERFIL_INCOMPLETO',
          mensaje: 'El usuario no tiene un perfil clínico completo.',
        });
      }

      flujo = await this.arboles.buscarPublicadoPersonalizado(contexto.perfil);
    }

    if (flujo === null) {
      if (
        contexto.modalidad === ModalidadConversacional.PERSONALIZADA &&
        contexto.perfil !== null
      ) {
        const { total } = await this.arboles.listarFlujos({
          modalidad: ModalidadConversacional.PERSONALIZADA,
          tipoDependencia: contexto.perfil.tipoDependencia,
          tipoCraving: contexto.perfil.tipoCraving,
          page: 1,
          pageSize: 1,
        });

        if (total > 0) {
          throw new ConflictException({
            codigo: 'FLUJO_NO_PUBLICADO',
            mensaje:
              'Existen árboles para el perfil clínico, pero ninguno está publicado.',
          });
        }
      }

      throw new NotFoundException({
        codigo: 'SIN_FLUJO_PUBLICADO',
        mensaje: 'No existe un árbol publicado para el contexto del usuario.',
      });
    }

    const arbol = await this.arboles.obtenerArbol(flujo.idFlujo);

    const nodoInicial = arbol?.nodos.find((nodo) => nodo.esNodoInicial);

    if (nodoInicial === undefined) {
      throw new InternalServerErrorException({
        codigo: 'NODO_INICIAL_NO_DISPONIBLE',
        mensaje: 'El árbol publicado no tiene un nodo inicial disponible.',
      });
    }

    const resultado = await this.sesiones.iniciarOReanudar({
      idUsuario,
      idFlujoConversacional: flujo.idFlujo,
      versionArbolUtilizada: flujo.version,
      modalidadActiva: contexto.modalidad,
      tipoDependencia: contexto.perfil?.tipoDependencia ?? null,
      tipoCraving: contexto.perfil?.tipoCraving ?? null,
      idNodoInicial: nodoInicial.idNodo,
    });

    return this.construirRespuesta(resultado, ubicacion);
  }

  private datosDesdeSesionExistente(
    sesion: SesionConversacional,
  ): DatosNuevaSesionConversacional {
    return {
      idUsuario: sesion.idUsuario,
      idFlujoConversacional: sesion.idFlujoConversacional,
      versionArbolUtilizada: sesion.versionArbolUtilizada,
      modalidadActiva: sesion.modalidadActiva,
      tipoDependencia: sesion.tipoDependencia,
      tipoCraving: sesion.tipoCraving,
      idNodoInicial: sesion.idNodoActual,
    };
  }

  private async construirRespuesta(
    resultado: ResultadoInicioSesionConversacional,
    ubicacion: UbicacionTemporalUsuarioDtoResponse,
  ): Promise<InicioSesionConversacionalResponse> {
    const { sesion } = resultado;

    const nodo = await this.arboles.buscarNodo(sesion.idNodoActual);

    if (nodo === null) {
      throw new InternalServerErrorException({
        codigo: 'NODO_ACTUAL_NO_DISPONIBLE',
        mensaje: 'No se encontró el nodo actual de la sesión.',
      });
    }

    this.verificarPertenenciaNodo(nodo, sesion);

    return {
      reanudada: resultado.reanudada,
      sesion: {
        id_sesion: sesion.idSesion,
        id_flujo_conversacional: sesion.idFlujoConversacional,
        version_arbol_utilizada: sesion.versionArbolUtilizada,
        modalidad_activa: sesion.modalidadActiva,
        tipo_dependencia: sesion.tipoDependencia,
        tipo_craving: sesion.tipoCraving,
        estado_actual: sesion.estadoActual,
        fecha_inicio: sesion.fechaInicio,
        fecha_ultima_interaccion: sesion.fechaUltimaInteraccion,
      },
      nodo_actual: {
        id_nodo: nodo.idNodo,
        tipo_nodo: nodo.nombreTipoNodo,
        contenido: nodo.contenido,
        es_nodo_inicial: nodo.esNodoInicial,
        orden: nodo.orden,
      },
      ubicacion_temporal: {
        id_unidad_temporal: ubicacion.id_unidad_temporal,
        nombre_unidad: ubicacion.nombre_unidad,
        finalizado_programa: ubicacion.cronograma_finalizado,
      },
    };
  }

  private verificarPertenenciaNodo(
    nodo: NodoConversacional,
    sesion: SesionConversacional,
  ): void {
    if (nodo.idFlujo !== sesion.idFlujoConversacional) {
      throw new InternalServerErrorException({
        codigo: 'NODO_FUERA_DE_FLUJO',
        mensaje: 'El nodo actual no pertenece al flujo de la sesión.',
      });
    }
  }
}
