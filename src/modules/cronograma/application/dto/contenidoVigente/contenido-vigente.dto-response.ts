import { ContenidoVigenteUsuario } from '../../../domain/entities/contenido-vigente-usuario.entity';
import { EstadoContenido } from '../../../domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../../domain/enums/tipo-contenido.enum';

export class ContenidoVigenteDtoResponse {
  id_contenido!: string;
  id_contenido_cronograma!: string;
  nombre_contenido!: string;
  tipo_contenido!: TipoContenido;
  id_unidad_temporal!: string;
  nombre_unidad!: string;
  orden_unidad!: number;
  orden_contenido!: number | null;
  fecha_inicio_disponibilidad!: Date;
  fecha_fin_disponibilidad!: Date;
  estado_disponibilidad!: EstadoContenido;

  static crear(
    contenido: ContenidoVigenteUsuario,
  ): ContenidoVigenteDtoResponse {
    return {
      id_contenido: contenido.idContenido,
      id_contenido_cronograma: contenido.idContenidoCronograma,
      nombre_contenido: contenido.nombreContenido,
      tipo_contenido: contenido.tipoContenido,
      id_unidad_temporal: contenido.idUnidadTemporal,
      nombre_unidad: contenido.nombreUnidad,
      orden_unidad: contenido.ordenUnidad,
      orden_contenido: contenido.ordenContenido,
      fecha_inicio_disponibilidad: contenido.fechaInicioDisponibilidad,
      fecha_fin_disponibilidad: contenido.fechaFinDisponibilidad,
      estado_disponibilidad: contenido.estadoDisponibilidad,
    };
  }
}
