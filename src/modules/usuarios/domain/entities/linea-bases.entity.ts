import { randomUUID } from "crypto";
import { frecuenciaConsumo } from "../value-objects/frecuencia-consumo.vo";
import { semestreCursado } from "../value-objects/semestre-cursado.vo";
import {NivelAcademico} from "../enums/nivel-academico-enum";
import {MotivoConsumo} from "../enums/motivo-consumo-enum";

export class LineaBase {

    private constructor(

        private readonly id_linea_base: string,
        private readonly id_usuario: string,
        private ciudad: string,
        private entidad_educativa: string,
        private programa_academico: string,
        private semestre: semestreCursado,
        private nivelAcademico: NivelAcademico,
        private fechaInicioConsumo: Date,
        private fechaUltimoConsumo: Date,
        private motivoInicioConsumo: MotivoConsumo,
        private frecuenciaConsumo: frecuenciaConsumo,
        private fechaCreacion: Date, 
        private fechaActualizacion: Date,
        private fechaNacimiento: Date

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

    getId(): string {
        return this.id_linea_base;
    }

    getUsuarioId(): string {
        return this.id_usuario;
    }

    getCiudad(): string {
        return this.ciudad;
    }

    getEntidadEducativa(): string {
        return this.entidad_educativa;
    }

    getProgramaAcademico(): string {
        return this.programa_academico;
    }

    getSemestre(): semestreCursado {
        return this.semestre;
    }   

    getNivelAcademico(): NivelAcademico {
        return this.nivelAcademico;
    }

    getFechaInicioConsumo(): Date {
        return this.fechaInicioConsumo;
    }   

    getFechaUltimoConsumo(): Date {
        return this.fechaUltimoConsumo;
    }   

    getMotivoInicioConsumo(): MotivoConsumo {
        return this.motivoInicioConsumo;
    }

    getFrecuenciaConsumo(): frecuenciaConsumo {
        return this.frecuenciaConsumo;
    }

    getFechaCreacion(): Date {
        return this.fechaCreacion;
    }   

    getFechaActualizacion(): Date {
        return this.fechaActualizacion;
    }   

    getFechaNacimiento(): Date {
        return this.fechaNacimiento;
    }   

}