import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DomainException } from '../../../domain/exceptions/domain.exception';
import {
  ConflictoRespuestaConversacionalException,
  ConfiguracionRespuestaInvalida,
  RespuestaConversacionalNoEncontradaException,
} from '../../../domain/exceptions/respuesta.exceptions';
import { MotorRespuestaConversacional } from '../../../domain/policies/motor-respuesta-conversacional.policy';
import {
  CapturaPerfilRespuesta,
  CapturaPerfilRespuestaPolicy,
} from '../../../domain/policies/captura-perfil-respuesta.policy';
import { ProcesarRespuestaDtoRequest } from '../../dto/procesar-respuesta.dto-request';
import {
  ResultadoRespuesta,
  recuperarResultadoRespuesta,
} from '../../dto/procesar-respuesta.dto-response';
import {
  ComprobarFormatoRespuestaPort,
  ProcesarRespuestaPort,
  TransaccionRespuesta,
} from '../../ports/procesar-respuesta.port';

@Injectable()
export class ProcesarRespuestaUseCase {
  private readonly motor = new MotorRespuestaConversacional();
  private readonly perfil = new CapturaPerfilRespuestaPolicy();

  constructor(
    private readonly persistencia: ProcesarRespuestaPort,
    private readonly formato: ComprobarFormatoRespuestaPort,
  ) {}

  async execute(
    idSesion: string,
    idUsuario: string,
    dto: ProcesarRespuestaDtoRequest,
  ): Promise<ResultadoRespuesta> {
    try {
      return await this.persistencia.ejecutar(async (tx) => {
        const sesion = await tx.contexto.bloquearSesion(idSesion, idUsuario);
        if (sesion === null)
          throw new RespuestaConversacionalNoEncontradaException(
            'No se pudo recuperar el contenido del chat.',
            'SESION_NO_ENCONTRADA',
          );
        const anterior = await tx.registro.buscarResultado(dto.idRespuesta);
        if (anterior !== null) {
          if (anterior.idSesion !== idSesion)
            throw new ConflictoRespuestaConversacionalException(
              'La respuesta no corresponde a este contexto de conversación.',
              'NODO_DESACTUALIZADO',
            );
          const resultado = recuperarResultadoRespuesta(anterior.resultado);
          if (resultado.idRespuesta !== dto.idRespuesta)
            throw new Error('Resultado inconsistente.');
          return resultado;
        }
        if (sesion.estadoActual !== 'ACTIVA')
          throw new ConflictoRespuestaConversacionalException(
            'La sesión debe estar activa para responder.',
            'SESION_NO_ACTIVA',
          );
        if (sesion.idNodoActual !== dto.idNodo)
          throw new ConflictoRespuestaConversacionalException(
            'La conversación avanzó. Consulte el nodo actual.',
            'NODO_DESACTUALIZADO',
          );
        const nodo = await tx.contexto.buscarNodo(dto.idNodo);
        if (nodo === null || nodo.idFlujo !== sesion.idFlujoConversacional)
          throw new ConfiguracionRespuestaInvalida(
            'DESTINO_INVALIDO',
            'El nodo de la conversación no es válido.',
          );
        this.perfil.comprobarModalidad(nodo, sesion.modalidadActiva);
        const transiciones = await tx.contexto.buscarTransiciones(nodo.idNodo);
        const decision = this.motor.resolver(
          nodo,
          transiciones,
          dto.valor,
          (patron, texto) => this.formato.coincide(patron, texto),
          dto.tipoEntrada,
          (valor) => {
            this.perfil.capturar(nodo, valor);
          },
        );
        const captura = this.perfil.capturar(nodo, decision.respuesta);
        const destino = await tx.contexto.buscarNodo(decision.idNodoDestino);
        if (destino === null || destino.idFlujo !== nodo.idFlujo)
          throw new ConfiguracionRespuestaInvalida(
            'DESTINO_INVALIDO',
            'El nodo destino no es válido.',
          );
        const esTerminal = !(await tx.contexto.tieneSalidas(
          destino.idNodo,
          nodo.idFlujo,
        ));
        const resultado: ResultadoRespuesta = {
          idRespuesta: dto.idRespuesta,
          resultado: 'VALIDA',
          transicion: {
            idNodoOrigen: nodo.idNodo,
            idNodoDestino: destino.idNodo,
            esTerminal,
          },
          estadoSesion: esTerminal ? 'COMPLETADA' : 'ACTIVA',
        };
        const ahora = new Date();
        if (captura !== null)
          await this.guardarPerfil(
            tx,
            idUsuario,
            captura,
            new Date(dto.capturadaEn),
            ahora,
          );
        await tx.registro.guardar({
          solicitud: {
            idSesion,
            idUsuario,
            idNodo: nodo.idNodo,
            idRespuesta: dto.idRespuesta,
            fechaCaptura: new Date(dto.capturadaEn),
          },
          decision,
          resultado,
          ahora,
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
        'No fue posible procesar la respuesta en este momento.',
      );
    }
  }

  private async guardarPerfil(
    tx: TransaccionRespuesta,
    idUsuario: string,
    captura: CapturaPerfilRespuesta,
    fecha: Date,
    ahora: Date,
  ): Promise<void> {
    try {
      await tx.perfil.guardar(idUsuario, captura, fecha, ahora);
    } catch {
      throw new InternalServerErrorException({
        codigo: 'ERROR_PERFIL',
        mensaje:
          'No fue posible registrar la variable clínica en este momento. Intente nuevamente más tarde.',
      });
    }
  }
}
