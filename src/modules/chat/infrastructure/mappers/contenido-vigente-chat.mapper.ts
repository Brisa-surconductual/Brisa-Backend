import { ContenidoVigenteDtoResponse } from '../../../cronograma/application/dto/contenidoVigente/contenido-vigente.dto-response';
import { ContenidoVigenteChat } from '../../domain/entities/contenido-vigente/contenido-vigente-chat.entity';

export class ContenidoVigenteChatMapper {
  static toDomain(
    contenido: ContenidoVigenteDtoResponse,
  ): ContenidoVigenteChat {
    return new ContenidoVigenteChat(
      contenido.id_contenido,
      contenido.id_contenido_cronograma,
      contenido.nombre_contenido,
      contenido.tipo_contenido,
      contenido.id_unidad_temporal,
      contenido.nombre_unidad,
      contenido.orden_unidad,
      contenido.orden_contenido,
      contenido.fecha_inicio_disponibilidad,
      contenido.fecha_fin_disponibilidad,
      contenido.estado_disponibilidad,
    );
  }
}
