import { randomUUID } from "crypto";
import { frecuenciaConsumo } from "../value-objects/frecuencia-consumo.vo";
import { semestreCursado } from "../value-objects/semestre-cursado.vo";
import {NivelAcademico} from "../enums/nivel-academico-enum";
import {MotivoConsumo} from "../enums/motivo-consumo-enum";

export class LineaBase {

    constructor(

        readonly id_linea_base: string,
        readonly id_usuario: string,
        readonly ciudad: string,
        readonly entidad_educativa: string,
        readonly programa_academico: string,
        readonly semestre: semestreCursado,
        readonly nivelAcademico: NivelAcademico,
        readonly fechaInicioConsumo: Date,
        readonly fechaUltimoConsumo: Date,
        readonly motivoInicioConsumo: MotivoConsumo,
        readonly frecuenciaConsumo: frecuenciaConsumo,
        readonly fechaCreacion: Date, 
        readonly fechaActualizacion: Date,
        readonly fechaNacimiento: Date

    ) {}

    static crear(
        idUsuario: string,
        ciudad: string,
        entidadEducativa: string,
        programaAcademico: string,
        semestre: semestreCursado,
        nivelAcademico: NivelAcademico,
        fechaInicioConsumo: Date,
        fechaUltimoConsumo: Date,
        motivoInicioConsumo: MotivoConsumo,
        frecuencia: frecuenciaConsumo,
        fechaCreacion: Date,
        fechaNacimiento: Date,

    ): LineaBase {

        return new LineaBase(
            randomUUID(),
            idUsuario,
            ciudad,
            entidadEducativa,
            programaAcademico,
            semestre,
            nivelAcademico,
            fechaInicioConsumo,
            fechaUltimoConsumo,
            motivoInicioConsumo,
            frecuencia,
            new Date(),
            new Date(),
            fechaNacimiento
        );

    }
 

}