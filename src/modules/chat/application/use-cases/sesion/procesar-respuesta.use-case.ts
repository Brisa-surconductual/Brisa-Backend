import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DomainException } from '../../../domain/exceptions/domain.exception';
import {
  IntervencionSosFinalizadaException,
  TiempoSosAgotadoException,
} from '../../../domain/exceptions/sos.exceptions';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import {
  ElementoEtiquetado,
  VariableTaxonomia,
} from '../../../domain/entities/taxonomia/variable-taxonomia.entity';
import {
  ConflictoRespuestaConversacionalException,
  ConfiguracionRespuestaInvalida,
  configuracionRespuestaInvalida as configuracion,
  NodoEnEsperaCronogramaException,
  RespuestaConversacionalNoEncontradaException,
} from '../../../domain/exceptions/respuesta.exceptions';
import { MotorRespuestaConversacional } from '../../../domain/policies/motor-respuesta-conversacional.policy';
import { CapturaPerfilRespuestaPolicy } from '../../../domain/policies/captura-perfil-respuesta.policy';
import { EtiquetadoVariablePolicy } from '../../../domain/policies/etiquetado-variable.policy';
import { extraerVariableNodo } from '../../../domain/policies/variable-nodo';
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
import { huellaInteraccion } from '../../services/huella-interaccion';
import { EstadoConversacionalService } from '../../services/estado-conversacional.service';
import { HabilitacionNodoService } from '../../services/habilitacion-nodo.service';

@Injectable()
export class ProcesarRespuestaUseCase {
  private readonly motor = new MotorRespuestaConversacional();
  private readonly perfil = new CapturaPerfilRespuestaPolicy();
  private readonly etiquetado = new EtiquetadoVariablePolicy();

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
        // RF-43: la sesión SOS solo se responde dentro de los 60 s de su
        // intervención, medidos por el reloj del servidor.
        if (sesion.esSos) {
          const sos = await tx.contexto.estadoIntervencionSos(idSesion);
          if (sos === null || !sos.enCurso)
            throw new IntervencionSosFinalizadaException();
          if (sos.vencida) throw new TiempoSosAgotadoException();
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
        // RF-30B: se etiqueta antes de escribir; un valor fuera de la
        // taxonomía es un 400 sin escrituras.
        const etiquetado = await this.etiquetar(tx, nodo, decision.respuesta);
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
        // RF-30B: después de la captura clínica y de guardar la interacción
        // (FK), con el perfil vigente en esta misma transacción.
        if (etiquetado !== null) {
          const perfil = await tx.variables.snapshotPerfil(idUsuario);
          await tx.variables.registrar({
            idInteraccion,
            idSesion,
            idUsuario,
            idNodo: nodo.idNodo,
            idVariable: etiquetado.idVariable,
            codigoVariable: etiquetado.variable.codigo,
            valor: decision.respuesta,
            elementos: etiquetado.elementos,
            modalidad: sesion.modalidadActiva,
            perfil,
            estado: this.etiquetado.estado(perfil),
            versionTaxonomia: await tx.variables.versionActual(),
            secuencia: dto.secuencia,
            timestampInteraccion: new Date(dto.timestamp_interaccion),
          });
        }
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

  /** RF-30B: etiqueta la respuesta si el nodo captura una variable. */
  private async etiquetar(
    tx: TransaccionRespuesta,
    nodo: NodoConversacional,
    valor: unknown,
  ): Promise<{
    variable: VariableTaxonomia;
    idVariable: string;
    elementos: ElementoEtiquetado[];
  } | null> {
    const marca = extraerVariableNodo(nodo.contenido);
    if (marca === null) return null;
    const variable = await tx.variables.buscarVariable(marca.codigo);
    if (variable === null || variable.idVariable === null)
      return configuracion('La variable del nodo no existe en la taxonomía.');
    const elementos = this.etiquetado.etiquetar(variable, valor);
    return elementos === null
      ? null
      : { variable, idVariable: variable.idVariable, elementos };
  }
}
