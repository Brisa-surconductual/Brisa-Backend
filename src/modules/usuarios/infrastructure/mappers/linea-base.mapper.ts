import { LineaBase } from "../../domain/entities/linea-bases.entity";


export class LineaBaseMapper {

    static toPrisma(lineaBase: LineaBase) {

        return {

            id_linea_base: lineaBase.id_linea_base,

            id_usuario: lineaBase.id_usuario,

            ciudad: lineaBase.ciudad,

            entidad_educativa: lineaBase.entidad_educativa,

            programa_academico: lineaBase.programa_academico,

            semestre_cursado: lineaBase.semestre,

            nivel_academico: lineaBase.nivelAcademico,

            fecha_inicio_consumo: lineaBase.fechaInicioConsumo,

            fecha_ultimo_consumo: lineaBase.fechaUltimoConsumo,

            motivo_inicio_consumo: lineaBase.motivoInicioConsumo,

            frecuencia_consumo: lineaBase.frecuenciaConsumo,

            fecha_creacion: lineaBase.fechaCreacion,

            fecha_actualizacion: lineaBase.fechaActualizacion,

            fecha_nacimiento: lineaBase.fechaNacimiento,

        };

    }

}