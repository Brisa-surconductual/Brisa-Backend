import { esObjetoRespuesta as objeto } from '../../domain/policies/configuracion-entrada-respuesta';

export interface ResultadoRespuesta {
  idRespuesta: string;
  resultado: 'VALIDA';
  transicion: {
    idNodoOrigen: string;
    idNodoDestino: string;
    esTerminal: boolean;
  };
  estadoSesion: 'ACTIVA' | 'COMPLETADA';
}

/** Solo recupera campos del contrato; nunca devuelve JSON arbitrario persistido. */
export function recuperarResultadoRespuesta(
  valor: unknown,
): ResultadoRespuesta {
  if (
    !objeto(valor) ||
    typeof valor.idRespuesta !== 'string' ||
    valor.resultado !== 'VALIDA' ||
    (valor.estadoSesion !== 'ACTIVA' && valor.estadoSesion !== 'COMPLETADA') ||
    !objeto(valor.transicion) ||
    typeof valor.transicion.idNodoOrigen !== 'string' ||
    typeof valor.transicion.idNodoDestino !== 'string' ||
    typeof valor.transicion.esTerminal !== 'boolean'
  )
    throw new Error(
      'No está disponible el resultado original de la respuesta.',
    );
  return {
    idRespuesta: valor.idRespuesta,
    resultado: 'VALIDA',
    estadoSesion: valor.estadoSesion,
    transicion: {
      idNodoOrigen: valor.transicion.idNodoOrigen,
      idNodoDestino: valor.transicion.idNodoDestino,
      esTerminal: valor.transicion.esTerminal,
    },
  };
}
