import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CalcularUbicacionTemporalUsuarioUseCase } from '../../../../cronograma/application/use-cases/cronograma/calcular-ubicacion-temporal-usuario.use-case';
import { UbicacionTemporalUsuarioDtoResponse } from '../../../../cronograma/application/dto/cronograma/ubicacion-temporal-usuario.dto-response';
import { FlujoConversacional } from '../../../domain/entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { DeterminarContextoConversacionalUseCase } from './determinar-contexto-conversacional.use-case';
import {
  PerfilClinicoIncompletoException,
  SesionActivaExistenteException,
} from '../../../domain/exceptions';
import { AsignacionCronogramaChatRepository } from '../../../domain/repositories/asignacion-cronograma-chat.repository';
import {
  ContextoConversacionalDtoResponse,
  InicioSesionConversacionalDtoResponse,
} from '../../dto/sesion-conversacional.dto-response';

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
  ): Promise<InicioSesionConversacionalDtoResponse> {
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
      const sesion = await this.reanudar(existente);

      return this.construirRespuesta(sesion, true, ubicacion);
    }

    let contexto: ContextoConversacionalDtoResponse;

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

    const flujo =
      contexto.modalidad === ModalidadConversacional.GRUPAL
        ? await this.seleccionarArbolGrupal()
        : await this.seleccionarArbolPersonalizado(idUsuario, contexto);

    const arbol = await this.arboles.obtenerArbol(flujo.idFlujo);

    const nodoInicial = arbol?.nodos.find((nodo) => nodo.esNodoInicial);

    if (nodoInicial === undefined) {
      throw new InternalServerErrorException({
        codigo: 'NODO_INICIAL_NO_DISPONIBLE',
        mensaje: 'El árbol publicado no tiene un nodo inicial disponible.',
      });
    }

    const nueva = SesionConversacional.iniciar(
      {
        idSesion: randomUUID(),
        idUsuario,
        idFlujoConversacional: flujo.idFlujo,
        versionArbolUtilizada: flujo.version,
        modalidadActiva: contexto.modalidad,
        tipoDependencia: contexto.perfil?.tipo_dependencia ?? null,
        tipoCraving: contexto.perfil?.tipo_craving ?? null,
        idNodoInicial: nodoInicial.idNodo,
      },
      new Date(),
    );

    try {
      await this.sesiones.guardar(nueva);
    } catch (error: unknown) {
      if (!(error instanceof SesionActivaExistenteException)) {
        throw error;
      }

      const concurrente = await this.sesiones.buscarUltimaReanudable(idUsuario);

      if (concurrente === null) {
        throw error;
      }

      const sesion = await this.reanudar(concurrente);

      return this.construirRespuesta(sesion, true, ubicacion);
    }

    return this.construirRespuesta(nueva, false, ubicacion);
  }

  private async seleccionarArbolGrupal(): Promise<FlujoConversacional> {
    const flujo = await this.arboles.buscarPublicadoGrupal();

    if (flujo === null) {
      throw new NotFoundException({
        codigo: 'SIN_FLUJO_PUBLICADO',
        mensaje: 'No existe un árbol publicado para el contexto del usuario.',
      });
    }

    return flujo;
  }

  /**
   * RF-26B: devuelve el árbol personalizado publicado del perfil. Si no existe,
   * no está publicado o no se pudo consultar, la sesión queda registrada en
   * ERROR_CONFIGURACION y no se registra ningún árbol activo.
   */
  private async seleccionarArbolPersonalizado(
    idUsuario: string,
    contexto: ContextoConversacionalDtoResponse,
  ): Promise<FlujoConversacional> {
    const perfil = contexto.perfil;

    if (perfil === null) {
      throw new ConflictException({
        codigo: 'PERFIL_INCOMPLETO',
        mensaje: 'El usuario no tiene un perfil clínico completo.',
      });
    }

    let motivo: ConflictException | NotFoundException;

    try {
      const flujo = await this.arboles.buscarPublicadoPersonalizado(
        perfil.tipo_dependencia,
        perfil.tipo_craving,
      );

      if (flujo !== null) {
        return flujo;
      }

      const { total } = await this.arboles.listarFlujos(
        {
          modalidad: ModalidadConversacional.PERSONALIZADA,
          tipoDependencia: perfil.tipo_dependencia,
          tipoCraving: perfil.tipo_craving,
        },
        1,
        1,
      );

      motivo =
        total > 0
          ? new ConflictException({
              codigo: 'FLUJO_NO_PUBLICADO',
              mensaje:
                'El árbol conversacional personalizado para este perfil aún no se encuentra disponible para uso.',
            })
          : new NotFoundException({
              codigo: 'SIN_FLUJO_PUBLICADO',
              mensaje:
                'No se encontró un árbol conversacional personalizado configurado para el perfil clínico del usuario. Contacte al equipo de psicología.',
            });
    } catch {
      await this.registrarErrorConfiguracion(idUsuario, contexto);

      throw new InternalServerErrorException({
        codigo: 'ERROR_CARGA_ARBOL',
        mensaje:
          'No fue posible cargar el árbol conversacional personalizado en este momento. Intente nuevamente más tarde.',
      });
    }

    await this.registrarErrorConfiguracion(idUsuario, contexto);

    throw motivo;
  }

  /** El motivo original es el que se informa: un fallo al registrar no lo reemplaza. */
  private async registrarErrorConfiguracion(
    idUsuario: string,
    contexto: ContextoConversacionalDtoResponse,
  ): Promise<void> {
    try {
      await this.sesiones.guardar(
        SesionConversacional.registrarErrorConfiguracion(
          {
            idSesion: randomUUID(),
            idUsuario,
            modalidadActiva: contexto.modalidad,
            tipoDependencia: contexto.perfil?.tipo_dependencia ?? null,
            tipoCraving: contexto.perfil?.tipo_craving ?? null,
          },
          new Date(),
        ),
      );
    } catch {
      // Sin acción: se informa el motivo de configuración.
    }
  }

  private async reanudar(
    existente: SesionConversacional,
  ): Promise<SesionConversacional> {
    const reanudada = existente.reanudar();

    if (reanudada !== existente) {
      await this.sesiones.guardar(reanudada);
    }

    return reanudada;
  }

  private async construirRespuesta(
    sesion: SesionConversacional,
    reanudada: boolean,
    ubicacion: UbicacionTemporalUsuarioDtoResponse,
  ): Promise<InicioSesionConversacionalDtoResponse> {
    const nodo =
      sesion.idNodoActual === null
        ? null
        : await this.arboles.buscarNodo(sesion.idNodoActual);

    if (nodo === null) {
      throw new InternalServerErrorException({
        codigo: 'NODO_ACTUAL_NO_DISPONIBLE',
        mensaje: 'No se encontró el nodo actual de la sesión.',
      });
    }

    this.verificarPertenenciaNodo(nodo, sesion);

    return InicioSesionConversacionalDtoResponse.crear(
      sesion,
      nodo,
      reanudada,
      ubicacion,
    );
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
