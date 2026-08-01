import { LineaBase } from "../../domain/entities/linea-bases.entity";


export class LineaBaseMapper {

    static toPrisma(lineaBase: LineaBase) {

        return {

            id_linea_base: lineaBase.getId(),

            id_usuario: lineaBase.getUsuarioId(),

            ciudad: lineaBase.getCiudad(),

            entidad_educativa: lineaBase.getEntidadEducativa(),

            programa_academico: lineaBase.getProgramaAcademico(),

            semestre_cursado: lineaBase.getSemestre().getValue(),

            nivel_academico: lineaBase.getNivelAcademico(),

            fecha_inicio_consumo: lineaBase.getFechaInicioConsumo(),

            fecha_ultimo_consumo: lineaBase.getFechaUltimoConsumo(),

            motivo_inicio_consumo: lineaBase.getMotivoInicioConsumo(),

            frecuencia_consumo: lineaBase.getFrecuenciaConsumo().getValue(),

            fecha_creacion: lineaBase.getFechaCreacion(),

            fecha_actualizacion: lineaBase.getFechaActualizacion(),

            fecha_nacimiento: lineaBase.getFechaNacimiento(),

        };

    }

}