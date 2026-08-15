import { Cronograma } from '../../domain/entities/cronograma.entity';
import { CronogramaUsuario } from '../../domain/entities/cronograma-usuario.entity';

export class InicializarCronogramaUsuarioDtoResponse {
  id_cronograma_usuario!: string;
  cronograma_asignado!: {
    id_cronograma: string;
    nombre_cronograma: string;
    estado: string;
  };
  fecha_inicio_usuario!: Date;
  estado_operacion!: string;

  static crear(
    asignacion: CronogramaUsuario,
    cronograma: Cronograma,
  ): InicializarCronogramaUsuarioDtoResponse {
    const dto = new InicializarCronogramaUsuarioDtoResponse();
    dto.id_cronograma_usuario = asignacion.id_cronograma_usuario;
    dto.cronograma_asignado = {
      id_cronograma: cronograma.id_cronograma,
      nombre_cronograma: cronograma.nombre_cronograma,
      estado: cronograma.estado,
    };
    dto.fecha_inicio_usuario = asignacion.fecha_inicio_usuario;
    dto.estado_operacion = 'INICIALIZADO';
    return dto;
  }
}
