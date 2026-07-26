import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';

export type SiguientePasoRegistro =
  'CONSENTIMIENTO_LINEA_BASE' | 'REVISION_CONFIRMACION' | 'APLICACION';

export function obtenerSiguientePaso(
  estado: EstadoRegistro,
): SiguientePasoRegistro {
  switch (estado) {
    case EstadoRegistro.PENDIENTE_CONSENTIMIENTO:
      return 'CONSENTIMIENTO_LINEA_BASE';
    case EstadoRegistro.PENDIENTE_REVISION:
      return 'REVISION_CONFIRMACION';
    case EstadoRegistro.REGISTRO_COMPLETO:
      return 'APLICACION';
  }
}
