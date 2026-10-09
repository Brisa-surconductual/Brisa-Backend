export class ContenidoVigenteChatDtoResponse {
  id_contenido!: string;
  id_contenido_cronograma!: string;
  nombre_contenido!: string;
  tipo_contenido!: string;
  id_unidad_temporal!: string;
  nombre_unidad!: string;
  orden_unidad!: number;
  orden_contenido!: number | null;
  fecha_inicio_disponibilidad!: Date;
  fecha_fin_disponibilidad!: Date;
  estado_disponibilidad!: string;
}
