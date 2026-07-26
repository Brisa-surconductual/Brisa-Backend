import { $Enums, Prisma } from '@prisma/client';
import { LineaBase } from '../../domain/entities/linea-bases.entity';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';

export class LineaBaseMapper {
  static toPrisma(lineaBase: LineaBase): Prisma.linea_baseUncheckedCreateInput {
    return {
      id_linea_base: lineaBase.getId(),
      id_usuario: lineaBase.getUsuarioId(),
      ciudad: lineaBase.getCiudad(),
      entidad_educativa: lineaBase.getEntidadEducativa(),
      programa_academico: lineaBase.getProgramaAcademico(),
      semestre_cursado: lineaBase.getSemestre().getValue(),
      nivel_academico: lineaBase.getNivelAcademico(),
      edad: lineaBase.getEdad(),
      fecha_inicio_consumo: lineaBase.getFechaInicioConsumo(),
      fecha_ultimo_consumo: lineaBase.getFechaUltimoConsumo(),
      motivo_inicio_consumo: lineaBase.getMotivoInicioConsumo(),
      frecuencia_consumo: lineaBase.getFrecuenciaConsumo().getValue(),
      fecha_creacion: lineaBase.getFechaCreacion(),
      fecha_actualizacion: lineaBase.getFechaActualizacion(),
    };
  }

  static toDomain(lineaBase: {
    id_linea_base: string;
    id_usuario: string;
    ciudad: string;
    entidad_educativa: string;
    programa_academico: string;
    semestre_cursado: number;
    nivel_academico: $Enums.nivel_academico_enum;
    edad: number | null;
    fecha_nacimiento: Date | null;
    fecha_inicio_consumo: Date;
    fecha_ultimo_consumo: Date;
    motivo_inicio_consumo: $Enums.motivo_consumo_enum;
    frecuencia_consumo: number;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
  }): LineaBase {
    return LineaBase.reconstituir({
      id: lineaBase.id_linea_base,
      idUsuario: lineaBase.id_usuario,
      ciudad: lineaBase.ciudad,
      entidadEducativa: lineaBase.entidad_educativa,
      programaAcademico: lineaBase.programa_academico,
      semestre: lineaBase.semestre_cursado,
      nivelAcademico: lineaBase.nivel_academico as NivelAcademico,
      edad:
        lineaBase.edad ??
        (lineaBase.fecha_nacimiento
          ? calcularEdad(lineaBase.fecha_nacimiento)
          : 0),
      fechaInicioConsumo: lineaBase.fecha_inicio_consumo,
      fechaUltimoConsumo: lineaBase.fecha_ultimo_consumo,
      motivoInicioConsumo: lineaBase.motivo_inicio_consumo as MotivoConsumo,
      frecuenciaConsumo: lineaBase.frecuencia_consumo,
      fechaCreacion: lineaBase.fecha_creacion,
      fechaActualizacion: lineaBase.fecha_actualizacion,
    });
  }
}

function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - fechaNacimiento.getUTCFullYear();
  const mes = hoy.getUTCMonth() - fechaNacimiento.getUTCMonth();
  if (
    mes < 0 ||
    (mes === 0 && hoy.getUTCDate() < fechaNacimiento.getUTCDate())
  ) {
    edad -= 1;
  }
  return edad;
}
