import { PausaAdministrativa } from '../../../domain/entities/pausa-administrativa.entity';
import { PausaAdministrativaDtoResponse } from './pausa-administrativa.dto-response';

export class AnularPausaAdministrativaDtoResponse extends PausaAdministrativaDtoResponse {
  mensaje!: string;

  static crear(
    pausa: PausaAdministrativa,
  ): AnularPausaAdministrativaDtoResponse {
    return {
      ...PausaAdministrativaDtoResponse.crear(pausa),
      mensaje: 'Pausa administrativa anulada correctamente.',
    };
  }
}
