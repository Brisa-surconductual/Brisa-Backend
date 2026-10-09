import { Injectable } from '@nestjs/common';
import { ConsultaContenidoVigentePort } from '../../../cronograma/application/ports/consulta-contenido-vigente.port';
import { ContenidoVigenteChatDtoResponse } from '../../application/dto/contenido-vigente-chat.dto-response';
import { ContenidoVigenteChatPort } from '../../application/ports/contenido-vigente-chat.port';

@Injectable()
export class CronogramaContenidoVigenteAdapter extends ContenidoVigenteChatPort {
  constructor(private readonly cronograma: ConsultaContenidoVigentePort) {
    super();
  }

  async consultar(
    idUsuario: string,
  ): Promise<ContenidoVigenteChatDtoResponse[]> {
    const contenidos = await this.cronograma.consultar(idUsuario, 'CHAT');

    return contenidos.map((contenido) => ({
      id_contenido: contenido.id_contenido,
      id_contenido_cronograma: contenido.id_contenido_cronograma,
      nombre_contenido: contenido.nombre_contenido,
      tipo_contenido: contenido.tipo_contenido,
      id_unidad_temporal: contenido.id_unidad_temporal,
      nombre_unidad: contenido.nombre_unidad,
      orden_unidad: contenido.orden_unidad,
      orden_contenido: contenido.orden_contenido,
      fecha_inicio_disponibilidad: contenido.fecha_inicio_disponibilidad,
      fecha_fin_disponibilidad: contenido.fecha_fin_disponibilidad,
      estado_disponibilidad: contenido.estado_disponibilidad,
    }));
  }
}
