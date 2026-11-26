import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  CONDICIONES_LOGRO_NARRATIVO,
  type CondicionLogroNarrativo,
  type CrearCapituloNarrativo,
  type CrearLogroNarrativo,
  type EditarCapituloNarrativo,
  type EditarLogroNarrativo,
  type GuardarReglaNivel,
} from '../../domain/results/contenido-narrativo';
import {
  FASES_NARRATIVAS,
  type FaseNarrativa,
} from '../../domain/enums/fase-narrativa.enum';
import { SiFueEnviado, TextoNoVacio } from '../http/validar-gestion-contenido';

class ContenidoCapituloDto {
  @TextoNoVacio(true)
  texto_historia?: string;

  @TextoNoVacio(true)
  mensaje_terapeutico_ligero?: string;

  @TextoNoVacio(true)
  instruccion_narrativa_mascota?: string;

  @IsOptional()
  @IsUUID()
  id_unidad_temporal?: string | null;

  @SiFueEnviado()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  orden?: number;

  @TextoNoVacio(true)
  justificacion_cambio?: string;
}

export class CrearCapituloNarrativoDto
  extends ContenidoCapituloDto
  implements CrearCapituloNarrativo
{
  @IsIn(FASES_NARRATIVAS)
  fase!: FaseNarrativa;

  @TextoNoVacio()
  titulo_capitulo!: string;
}

export class EditarCapituloNarrativoDto
  extends ContenidoCapituloDto
  implements EditarCapituloNarrativo
{
  @SiFueEnviado()
  @IsIn(FASES_NARRATIVAS)
  fase?: FaseNarrativa;

  @TextoNoVacio(true)
  titulo_capitulo?: string;
}

export class CrearLogroNarrativoDto implements CrearLogroNarrativo {
  @TextoNoVacio()
  nombre_logro!: string;

  @TextoNoVacio()
  descripcion_logro!: string;

  @TextoNoVacio()
  recurso_visual_logro!: string;

  @IsIn(CONDICIONES_LOGRO_NARRATIVO)
  condicion_desbloqueo!: CondicionLogroNarrativo;

  @IsOptional()
  @IsUUID()
  id_referencia?: string | null;

  @TextoNoVacio(true)
  justificacion_cambio?: string;
}

export class EditarLogroNarrativoDto implements EditarLogroNarrativo {
  @TextoNoVacio(true)
  nombre_logro?: string;

  @TextoNoVacio(true)
  descripcion_logro?: string;

  @TextoNoVacio(true)
  recurso_visual_logro?: string;

  @SiFueEnviado()
  @IsIn(CONDICIONES_LOGRO_NARRATIVO)
  condicion_desbloqueo?: CondicionLogroNarrativo;

  @IsOptional()
  @IsUUID()
  id_referencia?: string | null;

  @TextoNoVacio(true)
  justificacion_cambio?: string;
}

export class GuardarReglaNivelDto implements GuardarReglaNivel {
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  capitulos_requeridos!: number;

  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  logros_requeridos!: number;

  @TextoNoVacio(true)
  justificacion_cambio?: string;
}
