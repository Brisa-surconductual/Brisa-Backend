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
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { DeterminarContextoConversacionalUseCase } from './determinar-contexto-conversacional.use-case';
import {
  PerfilClinicoIncompletoException,
  SesionActivaExistenteException,
} from '../../../domain/exceptions';
import { EstadoSesionInconsistenteException } from '../../../domain/exceptions/sesion.exceptions';
import { AsignacionCronogramaChatRepository } from '../../../domain/repositories/asignacion-cronograma-chat.repository';
import {
  ContextoConversacionalDtoResponse,
  InicioSesionConversacionalDtoResponse,
} from '../../dto/sesion-conversacional.dto-response';
import { HistorialConversacionalInconsistenteException } from '../../exceptions/historial-conversacional-inconsistente.exception';
import { PresentarHistorialConversacionalService } from '../../services/presentar-historial-conversacional.service';
import { PresentarNodoActualService } from '../../services/presentar-nodo-actual.service';
import {
  EstadoSesionRecuperado,
  RecuperarSesionConversacionalService,
} from '../../services/recuperar-sesion-conversacional.service';

@Injectable()
export class IniciarOReanudarSesionUseCase {
  constructor(
    private readonly sesiones: SesionConversacionalRepository,
    private readonly arboles: ArbolConversacionalRepository,
    private readonly determinarContexto: DeterminarContextoConversacionalUseCase,
    private readonly calcularUbicacion: CalcularUbicacionTemporalUsuarioUseCase,
    private readonly asignacionCronograma: AsignacionCronogramaChatRepository,
    private readonly recuperacion: RecuperarSesionConversacionalService,
    private readonly presentarNodo: PresentarNodoActualService,
    private readonly presentarHistorial: PresentarHistorialConversacionalService,
  ) {}

  async execute(
    idUsuario: string,
  ): Promise<InicioSesionConversacionalDtoResponse> {
    const existente = await this.sesiones.buscarUltimaNoCompletada(idUsuario);
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
      const estado = await this.recuperacion.recuperar(
        existente.idSesion,
        idUsuario,
      );
      if (estado !== null)
        return this.construirRespuesta(estado, true, ubicacion);
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
    if (nodoInicial === undefined || nodoInicial.idFlujo !== flujo.idFlujo) {
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

    const respuestaNueva = await this.construirRespuesta(
      {
        sesion: nueva,
        nodo: nodoInicial,
        historial: { interacciones: [], hayMas: false },
        recuperadaDesdeHistorial: false,
      },
      false,
      ubicacion,
    );
    try {
      await this.sesiones.guardar(nueva);
    } catch (error: unknown) {
      if (!(error instanceof SesionActivaExistenteException)) throw error;

      const concurrente =
        await this.sesiones.buscarUltimaNoCompletada(idUsuario);
      if (concurrente === null) throw new EstadoSesionInconsistenteException();
      const estado = await this.recuperacion.recuperar(
        concurrente.idSesion,
        idUsuario,
      );
      if (estado === null) throw new EstadoSesionInconsistenteException();
      return this.construirRespuesta(estado, true, ubicacion);
    }
    return respuestaNueva;
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

  /** RF-26B registra en ERROR_CONFIGURACION el fallo al seleccionar un árbol personalizado. */
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
      if (flujo !== null) return flujo;
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
      // Se informa el motivo de configuración.
    }
  }

  private async construirRespuesta(
    estado: EstadoSesionRecuperado,
    reanudada: boolean,
    ubicacion: UbicacionTemporalUsuarioDtoResponse,
  ): Promise<InicioSesionConversacionalDtoResponse> {
    const { sesion, nodo, historial, recuperadaDesdeHistorial } = estado;
    try {
      const [actual, reciente] = await Promise.all([
        this.presentarNodo.preparar(sesion, nodo),
        this.presentarHistorial.presentar(
          historial,
          sesion.idFlujoConversacional,
        ),
      ]);
      return InicioSesionConversacionalDtoResponse.crear(
        sesion,
        actual.nodo,
        reciente,
        ubicacion,
        {
          reanudada,
          recuperadaDesdeHistorial,
        },
      );
    } catch (error: unknown) {
      if (error instanceof HistorialConversacionalInconsistenteException)
        throw new EstadoSesionInconsistenteException();
      throw error;
    }
  }
}
