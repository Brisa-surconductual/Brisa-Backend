import { PausaAdministrativa } from '../../../domain/entities/pausa-administrativa.entity';
import { EstadoPausa } from '../../../domain/enums/estado-pausa.enum';

export class RegistrarPausaAdministrativaDtoResponse {
  id_pausa!: string;
  id_usuario!: string;
  id_cronograma_usuario!: string;
  fecha_inicio_pausa!: Date;
  fecha_fin_pausa!: Date;
  motivo_pausa!: string;
  id_usuario_administrativo!: string;
  fecha_registro!: Date;
  estado_pausa!: EstadoPausa;
  mensaje!: string;

  static crear(
    pausa: PausaAdministrativa,
  ): RegistrarPausaAdministrativaDtoResponse {
    return {
      ...pausa,
      mensaje: 'Pausa administrativa registrada correctamente.',
    };
  }
}
