import {
  ElementoEtiquetado,
  VariableTaxonomia,
} from '../entities/taxonomia/variable-taxonomia.entity';
import { EstadoEtiquetado } from '../enums/tipo-valor-variable.enum';
import { SnapshotPerfilEtiquetado } from '../repositories/variables-etiquetadas.repository';
import { respuestaVacia } from './configuracion-entrada-respuesta';

/** RF-30B: etiqueta la respuesta de un nodo que captura una variable. */
export class EtiquetadoVariablePolicy {
  /** Una respuesta vacía (nodo opcional) no se etiqueta. */
  etiquetar(
    variable: VariableTaxonomia,
    valor: unknown,
  ): ElementoEtiquetado[] | null {
    if (respuestaVacia(valor)) return null;
    return variable.etiquetar(valor);
  }

  estado(perfil: SnapshotPerfilEtiquetado): EstadoEtiquetado {
    return perfil.tipoDependencia !== null && perfil.tipoCraving !== null
      ? EstadoEtiquetado.COMPLETO
      : EstadoEtiquetado.PENDIENTE_PERFIL;
  }
}
