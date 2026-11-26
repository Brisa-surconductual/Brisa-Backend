import { tipoEntradaConfigurado } from '../../domain/enums/tipo-entrada-respuesta.enum';
import { RegistroTrazabilidad } from '../../domain/repositories/historial-interacciones.repository';
import {
  DescripcionNodoHistorico,
  MotivoContenidoNoVerificable,
  etiquetaRespuestaHistorica,
} from '../services/describir-contenido-historico.service';

export type EstadoContenidoHistorico = 'VERIFICADO' | 'NO_VERIFICABLE';

export class RegistroTrazabilidadDtoResponse {
  secuencia!: number;
  id_nodo!: string;
  /** Valor guardado sin modificar (RF-27); CONTINUAR lleva `valor: null`. */
  respuesta_usuario!: { valor: unknown };
  /** null cuando el registro es el fin del flujo. */
  id_nodo_destino!: string | null;
  timestamp_interaccion!: string;

  // Ampliación para M-8 (aditiva; los campos anteriores no cambian).
  /** Tipo de entrada guardado con la respuesta (dato persistido, siempre). */
  tipo_entrada!: string;
  /** Si el contenido de abajo es el de la versión que vio el participante. */
  contenido_historico!: EstadoContenidoHistorico;
  /** null si el contenido es VERIFICADO. */
  motivo_no_verificable!: MotivoContenidoNoVerificable | null;
  /** null si NO_VERIFICABLE. */
  tipo_nodo!: string | null;
  /** null si NO_VERIFICABLE o si el nodo no tiene texto. */
  texto_nodo!: string | null;
  /**
   * Etiqueta de la opción elegida (opción única) o lista de etiquetas
   * (multiselección). null si no aplica, si no es verificable o si algún
   * valor no tiene etiqueta. Nunca reemplaza `respuesta_usuario.valor`.
   */
  etiqueta_respuesta!: string | string[] | null;
}

/** Trazabilidad de una sesión conversacional (solo lectura). */
export class TrazabilidadSesionDtoResponse {
  id_sesion!: string;
  /** Seudónimo del participante (A7). */
  id_participante!: string;
  registros!: RegistroTrazabilidadDtoResponse[];

  static crear(
    idSesion: string,
    idParticipante: string,
    registros: RegistroTrazabilidad[],
    descripciones: Map<string, DescripcionNodoHistorico> = new Map(),
  ): TrazabilidadSesionDtoResponse {
    return {
      id_sesion: idSesion,
      id_participante: idParticipante,
      registros: registros.map((registro) => {
        const descripcion = descripciones.get(registro.idNodo) ?? {
          verificable: false as const,
          motivo: MotivoContenidoNoVerificable.NODO_NO_DISPONIBLE,
        };
        return {
          secuencia: registro.secuencia,
          id_nodo: registro.idNodo,
          respuesta_usuario: { valor: registro.valor },
          id_nodo_destino: registro.idNodoDestino,
          timestamp_interaccion: registro.timestampInteraccion.toISOString(),
          tipo_entrada:
            tipoEntradaConfigurado(registro.tipoEntrada) ??
            registro.tipoEntrada,
          ...(descripcion.verificable
            ? {
                contenido_historico: 'VERIFICADO' as const,
                motivo_no_verificable: null,
                tipo_nodo: descripcion.tipoNodo,
                texto_nodo: descripcion.texto,
                etiqueta_respuesta: etiquetaRespuestaHistorica(
                  registro.tipoEntrada,
                  registro.valor,
                  descripcion.opciones,
                ),
              }
            : {
                contenido_historico: 'NO_VERIFICABLE' as const,
                motivo_no_verificable: descripcion.motivo,
                tipo_nodo: null,
                texto_nodo: null,
                etiqueta_respuesta: null,
              }),
        };
      }),
    };
  }
}
