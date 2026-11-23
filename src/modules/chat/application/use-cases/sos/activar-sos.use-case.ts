import { randomUUID } from 'node:crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ContextoOrigenSos } from '../../../domain/entities/sos/intervencion-sos.entity';
import {
  EstadoIntervencionSos,
  EstadoSesionAnteriorSos,
} from '../../../domain/enums/intervencion-sos.enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { TipoCravingClinico } from '../../../domain/enums/perfil-clinico.enum';
import {
  IntervencionSosEnCursoException,
  SinFlujoSosException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import {
  ActivarSosDtoRequest,
  ContextoOrigenSosDtoRequest,
  MAX_BYTES_ESTADO_CONTEXTO_SOS,
} from '../../dto/sos/activar-sos.dto-request';
import { ActivarSosDtoResponse } from '../../dto/sos/sos.dto-response';
import { NodoActualDtoResponse } from '../../dto/sesion-conversacional.dto-response';
import { IntervencionSosPort } from '../../ports/intervencion-sos.port';
import {
  PENDIENTE_PERFIL,
  PerfilClinicoVigentePort,
} from '../../ports/perfil-clinico-vigente.port';
import { PresentarNodoActualService } from '../../services/presentar-nodo-actual.service';
import { fechaServidorBogota } from '../../support/fecha-servidor-bogota';

/**
 * RF-43: el estudiante oprime "Tengo ganas de vapear".
 * 1. Pausa la sesión de terapia ACTIVA (motivo SOS_CRAVING), si la hay.
 * 2. Crea una sesión SOS en el nodo inicial del flujo SOS publicado.
 * 3. Registra la intervención; el inicio y el límite de 60 s salen del reloj
 *    de PostgreSQL.
 * Todo ocurre en una transacción serializada por estudiante. El evento a M05
 * se escribe al cerrar la intervención, con la duración real.
 */
@Injectable()
export class ActivarSosUseCase {
  constructor(
    private readonly sos: IntervencionSosPort,
    private readonly arboles: ArbolConversacionalRepository,
    private readonly perfilVigente: PerfilClinicoVigentePort,
    private readonly presentarNodo: PresentarNodoActualService,
  ) {}

  async execute(
    idUsuario: string,
    dto: ActivarSosDtoRequest = {},
  ): Promise<ActivarSosDtoResponse> {
    const flujo = await this.arboles.buscarPublicadoUnico(
      ModalidadConversacional.SOS,
    );
    if (flujo === null) throw new SinFlujoSosException();
    const arbol = await this.arboles.obtenerArbol(flujo.idFlujo);
    const nodoInicial = arbol?.nodos.find((nodo) => nodo.esNodoInicial);
    if (nodoInicial === undefined || nodoInicial.idFlujo !== flujo.idFlujo) {
      throw new InternalServerErrorException({
        codigo: 'NODO_INICIAL_NO_DISPONIBLE',
        mensaje: 'El flujo SOS publicado no tiene un nodo inicial disponible.',
      });
    }

    const tipoCraving = await this.tipoCravingVigente(idUsuario);
    const sesionSos = SesionConversacional.iniciar(
      {
        idSesion: randomUUID(),
        idUsuario,
        idFlujoConversacional: flujo.idFlujo,
        versionArbolUtilizada: flujo.version,
        modalidadActiva: ModalidadConversacional.SOS,
        tipoDependencia: null,
        tipoCraving,
        idNodoInicial: nodoInicial.idNodo,
      },
      new Date(),
    );
    // Se prepara antes de escribir: un fallo al presentar no deja nada a medias.
    const [presentado, recursos] = await Promise.all([
      this.presentarNodo.preparar(sesionSos, nodoInicial),
      this.sos.listarRecursosApoyo(),
    ]);
    const contextoOrigen = this.contextoOrigen(dto.contexto_origen);

    const intervencion = await this.sos.ejecutar(async (tx) => {
      await tx.bloquearUsuario(idUsuario);
      const enCurso = await tx.buscarEnCurso(idUsuario);
      if (enCurso?.estaVigente)
        throw new IntervencionSosEnCursoException(
          enCurso.idIntervencion,
          fechaServidorBogota(enCurso.finMaximoServidor),
        );
      if (enCurso !== null)
        await tx.cerrar(enCurso.idIntervencion, EstadoIntervencionSos.EXPIRADA);

      const pendiente = await tx.buscarSesionDeTerapiaPendiente(idUsuario);
      let estadoSesionAnterior = EstadoSesionAnteriorSos.NINGUNA;
      let idSesionPausada: string | null = null;
      if (pendiente?.estadoActual === 'ACTIVA') {
        await tx.pausarSesion(pendiente.pausar());
        estadoSesionAnterior = EstadoSesionAnteriorSos.ACTIVA;
        idSesionPausada = pendiente.idSesion;
      } else if (pendiente?.estadoActual === 'PAUSADA') {
        estadoSesionAnterior = EstadoSesionAnteriorSos.PAUSADA;
        idSesionPausada = pendiente.idSesion;
      }

      await tx.crearSesionSos(sesionSos);
      return tx.registrar({
        idUsuario,
        idSesionSos: sesionSos.idSesion,
        idSesionPausada,
        estadoSesionAnterior,
        tipoCraving,
        contextoOrigen,
      });
    });

    return ActivarSosDtoResponse.crear(
      intervencion,
      NodoActualDtoResponse.desde(presentado.nodo),
      recursos,
    );
  }

  /**
   * RF-39B: tipo de craving del perfil vigente; null si no está clasificado.
   * Un fallo al consultarlo nunca impide atender el SOS.
   */
  private async tipoCravingVigente(
    idUsuario: string,
  ): Promise<TipoCravingClinico | null> {
    try {
      const perfil = await this.perfilVigente.obtener(idUsuario);
      return perfil.tipo_craving === PENDIENTE_PERFIL
        ? null
        : perfil.tipo_craving;
    } catch {
      return null;
    }
  }

  /**
   * Ampliación B: un estado demasiado grande no bloquea el SOS; se conservan
   * el módulo y la ruta para poder volver.
   */
  private contextoOrigen(
    dto: ContextoOrigenSosDtoRequest | null | undefined,
  ): ContextoOrigenSos | null {
    if (dto === undefined || dto === null) return null;
    const estado = dto.estado ?? null;
    const cabe =
      estado === null ||
      Buffer.byteLength(JSON.stringify(estado), 'utf8') <=
        MAX_BYTES_ESTADO_CONTEXTO_SOS;
    return { modulo: dto.modulo, ruta: dto.ruta, estado: cabe ? estado : null };
  }
}
