import type { EstadoCohorte } from '../../enums/estado-cohorte.enum';
import {
  FechasCohorteInvalidasException,
  TransicionCohorteInvalidaException,
} from '../../exceptions/cohorte.exceptions';
import { esRangoFechasProgramaValido } from '../../value-objects/rango-fechas-programa.vo';
import { esTransicionCohortePermitida } from '../../value-objects/transicion-estado-cohorte.vo';

/** Datos editables de una cohorte (RF-124). */
export interface DatosCohorte {
  nombre_cohorte: string;
  fecha_inicio_programa: string;
  fecha_fin_programa: string;
  id_cronograma: string;
}

/** Cohorte de participantes asociada a un cronograma psicoeducativo (RF-124). */
export interface Cohorte extends DatosCohorte {
  id_cohorte: string;
  estado: EstadoCohorte;
  fecha_actualizacion: string;
}

/** Exige que el programa de la cohorte no termine antes de empezar. */
export function validarFechasCohorte(datos: DatosCohorte): void {
  if (
    !esRangoFechasProgramaValido(
      datos.fecha_inicio_programa,
      datos.fecha_fin_programa,
    )
  ) {
    throw new FechasCohorteInvalidasException();
  }
}

/** Exige que el cambio de estado siga el ciclo de vida de la cohorte. */
export function validarTransicionCohorte(
  actual: EstadoCohorte,
  destino: EstadoCohorte,
): void {
  if (!esTransicionCohortePermitida(actual, destino)) {
    throw new TransicionCohorteInvalidaException(actual, destino);
  }
}
