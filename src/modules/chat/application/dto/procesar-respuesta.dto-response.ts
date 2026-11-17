import { esObjetoRespuesta as objeto } from '../../domain/policies/configuracion-entrada-respuesta';

export interface ResultadoRespuesta {
  id_interaccion: string;
  secuencia: number;
  registrada_en: string;
  duplicada: boolean;
  transicion: {
    id_nodo_origen: string;
    id_nodo_destino: string;
    es_terminal: boolean;
  };
  estado_sesion: 'ACTIVA' | 'COMPLETADA';
}

/** Solo recupera los campos públicos de un resultado confirmado de RF-30. */
export function recuperarResultadoRespuesta(
  valor: unknown,
  idInteraccion: string,
): ResultadoRespuesta {
  if (
    !objeto(valor) ||
    valor.id_interaccion !== idInteraccion ||
    typeof valor.secuencia !== 'number' ||
    !Number.isInteger(valor.secuencia) ||
    valor.secuencia < 1 ||
    typeof valor.registrada_en !== 'string' ||
    !Number.isFinite(Date.parse(valor.registrada_en)) ||
    (valor.estado_sesion !== 'ACTIVA' &&
      valor.estado_sesion !== 'COMPLETADA') ||
    !objeto(valor.transicion) ||
    typeof valor.transicion.id_nodo_origen !== 'string' ||
    typeof valor.transicion.id_nodo_destino !== 'string' ||
    typeof valor.transicion.es_terminal !== 'boolean'
  )
    throw new Error(
      'No está disponible el resultado original de la interacción.',
    );
  return {
    id_interaccion: idInteraccion,
    secuencia: valor.secuencia,
    registrada_en: valor.registrada_en,
    duplicada: true,
    estado_sesion: valor.estado_sesion,
    transicion: {
      id_nodo_origen: valor.transicion.id_nodo_origen,
      id_nodo_destino: valor.transicion.id_nodo_destino,
      es_terminal: valor.transicion.es_terminal,
    },
  };
}
