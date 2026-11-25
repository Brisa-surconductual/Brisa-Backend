import { EstadoSnapshotAgregado } from '../enums/estado-snapshot-agregado.enum';
import { esObjeto } from './objeto-plano.vo';

/** El snapshot persistido corresponde a un agregado suprimido por privacidad. */
export function esSnapshotSuprimido(valor: unknown): boolean {
  return esObjeto(valor) && valor.estado === EstadoSnapshotAgregado.SUPRIMIDO;
}
