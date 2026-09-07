import { PausaAdministrativa } from '../../../domain/entities/pausa-administrativa.entity';
import { EstadoPausa } from '../../../domain/enums/estado-pausa.enum';

export class PausaAdministrativaDtoResponse {
  id_pausa!: string;
  id_usuario!: string;
  id_cronograma_usuario!: string;
  fecha_inicio_pausa!: Date;
  fecha_fin_pausa!: Date;
  motivo_pausa!: string;
  id_usuario_administrativo!: string;
  fecha_registro!: Date;
  estado_pausa!: EstadoPausa;

  static crear(pausa: PausaAdministrativa): PausaAdministrativaDtoResponse {
    return {
      id_pausa: pausa.id_pausa,
      id_usuario: pausa.id_usuario,
      id_cronograma_usuario: pausa.id_cronograma_usuario,
      fecha_inicio_pausa: pausa.fecha_inicio_pausa,
      fecha_fin_pausa: pausa.fecha_fin_pausa,
      motivo_pausa: pausa.motivo_pausa,
      id_usuario_administrativo: pausa.id_usuario_administrativo,
      fecha_registro: pausa.fecha_registro,
      estado_pausa: pausa.estado_pausa,
    };
  }
}
