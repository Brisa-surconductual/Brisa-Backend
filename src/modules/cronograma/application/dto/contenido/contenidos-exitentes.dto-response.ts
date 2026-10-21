import { IsBoolean, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { Contenido } from '../../../domain/entities/contenido.entity';
import { ContenidoCronograma } from '../../../domain/entities/contenido-cronograma.entity';
import { UnidadTemporal } from '../../../domain/entities/unidad-temporal.entity';
import { Cronograma } from '../../../domain/entities/cronograma.entity';
import { TipoContenido } from '../../../domain/enums/tipo-contenido.enum';
import { EstadoCronograma } from '../../../domain/enums/estado-cronograma.enum';

export class ContenidosExitentesDtoResponse {
  @IsString()
  idContenido!: string;

  @IsString()
  @IsOptional()
  idAsociasionUnidadTemporalContenido!: string | null;

  @IsBoolean()
  asociado!: boolean;

  @IsString()
  nombre!: string;

  @IsEnum(TipoContenido)
  tipoContenido!: TipoContenido;

  @IsDate()
  fechaCreacionContenido!: Date;

  @IsString()
  @IsOptional()
  nombreUnidadTemporal?: string | null;

  @IsString()
  @IsOptional()
  nombreUnidadPadreCronograma!: string | null;

  @IsEnum(EstadoCronograma)
  @IsOptional()
  estadoCronograma?: EstadoCronograma | null;

  static fromEntity(
    entity: Contenido,
    asociacion: ContenidoCronograma | null,
    unidadTemporal: UnidadTemporal | null,
    cronograma: Cronograma | null,
  ): ContenidosExitentesDtoResponse {
    const dto = new ContenidosExitentesDtoResponse();

    dto.idContenido = entity.id_contenido;
    dto.idAsociasionUnidadTemporalContenido =
      asociacion?.id_contenido_cronograma ?? null;
    dto.asociado = asociacion !== null;
    dto.nombre = entity.nombre_contenido;
    dto.tipoContenido = entity.tipo_contenido;
    dto.fechaCreacionContenido = entity.fecha_creacion;
    dto.nombreUnidadTemporal =
      unidadTemporal?.nombre != null ? String(unidadTemporal.nombre) : null;
    dto.nombreUnidadPadreCronograma =
      cronograma?.nombre_cronograma ?? null;
    dto.estadoCronograma = cronograma?.estado ?? null;

    return dto;
  }
}
