import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DomainException } from '../../../domain/exceptions/domain.exception';
import {
  ConflictoRespuestaConversacionalException,
  ConfiguracionRespuestaInvalida,
  NodoEnEsperaCronogramaException,
  RespuestaConversacionalNoEncontradaException,
} from '../../../domain/exceptions/respuesta.exceptions';
import { MotorRespuestaConversacional } from '../../../domain/policies/motor-respuesta-conversacional.policy';
import { CapturaPerfilRespuestaPolicy } from '../../../domain/policies/captura-perfil-respuesta.policy';
import { ProcesarRespuestaDtoRequest } from '../../dto/procesar-respuesta.dto-request';
import {
  ResultadoRespuesta,
  recuperarResultadoRespuesta,
} from '../../dto/procesar-respuesta.dto-response';
import {
  ComprobarFormatoRespuestaPort,
  ProcesarRespuestaPort,
} from '../../ports/procesar-respuesta.port';
import { huellaInteraccion } from '../../services/huella-interaccion';
import { EstadoConversacionalService } from '../../services/estado-conversacional.service';
import { HabilitacionNodoService } from '../../services/habilitacion-nodo.service';

@Injectable()
export class ProcesarRespuestaUseCase {
  private readonly motor = new MotorRespuestaConversacional();
  private readonly perfil = new CapturaPerfilRespuestaPolicy();

  constructor(
    private readonly persistencia: ProcesarRespuestaPort,
    private readonly formato: ComprobarFormatoRespuestaPort,
    private readonly estado: EstadoConversacionalService,
    private readonly habilitacion: HabilitacionNodoService,
  ) {}

  async execute(
    idSesion: string,
    idUsuario: string,
    dto: ProcesarRespuestaDtoRequest,
  ): Promise<ResultadoRespuesta> {
    try {
      idSesion = idSesion.toLowerCase();
      const idInteraccion = dto.id_interaccion.toLowerCase();
      const idNodo = dto.id_nodo.toLowerCase();
      const huella = huellaInteraccion(dto);
      return await this.persistencia.ejecutar(async (tx) => {
        const sesion = await tx.contexto.bloquearSesion(idSesion, idUsuario);
        if (sesion === null)
          throw new RespuestaConversacionalNoEncontradaException(
            'No se pudo recuperar el contenido del chat.',
            'SESION_NO_ENCONTRADA',
          );
        const anterior = await tx.registro.buscarResultado(idInteraccion);
        if (anterior !== null) {
          if (anterior.idSesion !== idSesion || anterior.huella !== huella)
            throw new ConflictoRespuestaConversacionalException(
              'El identificador de interacción ya fue utilizado.',
              'ID_INTERACCION_REUTILIZADA',
            );
          return recuperarResultadoRespuesta(anterior.resultado, idInteraccion);
        }
        if (sesion.estadoActual !== 'ACTIVA')
          throw new ConflictoRespuestaConversacionalException(
            'La sesión debe estar activa para responder.',
            'SESION_NO_ACTIVA',
          );
        if (dto.secuencia !== (await tx.registro.ultimaSecuencia(idSesion)) + 1)
          throw new ConflictoRespuestaConversacionalException(
            'La secuencia no corresponde a la siguiente interacción de la sesión.',
            'SECUENCIA_FUERA_DE_ORDEN',
          );
        if (sesion.idNodoActual !== idNodo)
          throw new ConflictoRespuestaConversacionalException(
            'La conversación avanzó. Consulte el nodo actual.',
            'NODO_DESACTUALIZADO',
          );
        const nodo = await tx.contexto.buscarNodo(idNodo);
        if (nodo === null || nodo.idFlujo !== sesion.idFlujoConversacional)
          throw new ConfiguracionRespuestaInvalida(
            'DESTINO_INVALIDO',
            'El nodo de la conversación no es válido.',
          );
        this.perfil.comprobarModalidad(nodo, sesion.modalidadActiva);
        // RF-24/RF-22: el ritmo lo marca el cronograma; un nodo cuyo
        // contenido aún no empieza para el estudiante no se puede responder.
        const disponibilidad = await this.habilitacion.evaluar(idUsuario, nodo);
        if (!disponibilidad.habilitado)
          throw new NodoEnEsperaCronogramaException(
            disponibilidad.habilitaAprox,
          );
        const transiciones = await tx.contexto.buscarTransiciones(nodo.idNodo);
        const idDestinoImplicito =
          transiciones.length === 0
            ? await tx.contexto.siguienteNodoImplicito(nodo.idNodo)
            : null;
        const decision = this.motor.resolver(
          nodo,
          transiciones,
          dto.valor,
          (patron, texto) => this.formato.coincide(patron, texto),
          dto.tipo_entrada,
          (valor) => {
            this.perfil.capturar(nodo, valor);
          },
          idDestinoImplicito,
        );
        const captura = this.perfil.capturar(nodo, decision.respuesta);
        const destino = await tx.contexto.buscarNodo(decision.idNodoDestino);
        if (destino === null || destino.idFlujo !== nodo.idFlujo)
          throw new ConfiguracionRespuestaInvalida(
            'DESTINO_INVALIDO',
            'El nodo destino no es válido.',
          );
        const esTerminal = await tx.contexto.esTerminal(
          destino.idNodo,
          nodo.idFlujo,
        );
        const ahora = new Date();
        const resultado: ResultadoRespuesta = {
          id_interaccion: idInteraccion,
          secuencia: dto.secuencia,
          registrada_en: ahora.toISOString(),
          duplicada: false,
          transicion: {
            id_nodo_origen: nodo.idNodo,
            id_nodo_destino: destino.idNodo,
            es_terminal: esTerminal,
          },
          estado_sesion: esTerminal ? 'COMPLETADA' : 'ACTIVA',
        };
        if (captura !== null)
          await tx.perfil.capturarDimension({
            idUsuario,
            idSesion,
            idNodo: nodo.idNodo,
            modalidadSesion: sesion.modalidadActiva,
            ...captura,
          });
        await tx.registro.guardar({
          solicitud: {
            idSesion,
            idUsuario,
            idNodo: nodo.idNodo,
            idInteraccion,
            secuencia: dto.secuencia,
            timestampInteraccion: dto.timestamp_interaccion,
            conectividad: dto.estado_conectividad,
            recursosNoPresentados: dto.recursos_no_presentados ?? null,
          },
          decision,
          resultado,
          huella,
          ahora,
        });
        await this.estado.registrarPaso(tx.estado, {
          idSesion,
          idUsuario,
          idInteraccion,
          idNodoOrigen: nodo.idNodo,
          idNodoDestino: destino.idNodo,
          valor: decision.respuesta,
          timestampInteraccion: dto.timestamp_interaccion,
          ahora,
          esTerminal,
        });
        return resultado;
      });
    } catch (error: unknown) {
      if (error instanceof DomainException || error instanceof HttpException)
        throw error;
      if (error instanceof ConfiguracionRespuestaInvalida)
        throw new InternalServerErrorException({
          codigo:
            error.codigo === 'DESTINO_INVALIDO'
              ? error.codigo
              : 'SIN_TRANSICION',
          mensaje:
            error.codigo === 'DESTINO_INVALIDO'
              ? 'El nodo destino no es válido.'
              : 'No se pudo determinar la siguiente acción en la conversación.',
        });
      throw new InternalServerErrorException(
        {
          codigo: 'ERROR_PERSISTENCIA',
          mensaje: 'No fue posible registrar la interacción.',
        },
        { cause: error },
      );
    }
  }
}
