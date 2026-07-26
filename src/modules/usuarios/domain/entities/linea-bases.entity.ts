import { randomUUID } from 'node:crypto';
import { DatosLineaBaseInvalidosException } from '../exceptions/usuario.exceptions';
import { MotivoConsumo } from '../enums/motivo-consumo-enum';
import { NivelAcademico } from '../enums/nivel-academico-enum';
import { FechasConsumoCoherentes } from '../value-objects/fechas-consumo-coherentes.vo';
import { FrecuenciaConsumo } from '../value-objects/frecuencia-consumo.vo';
import { SemestreCursado } from '../value-objects/semestre-cursado.vo';

export interface LineaBaseDatos {
  ciudad: string;
  entidadEducativa: string;
  programaAcademico: string;
  semestre: number;
  nivelAcademico: NivelAcademico;
  edad: number;
  fechaInicioConsumo: Date;
  fechaUltimoConsumo: Date;
  motivoInicioConsumo: MotivoConsumo;
  frecuenciaConsumo: number;
}

export interface LineaBaseReconstitucion extends LineaBaseDatos {
  id: string;
  idUsuario: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export class LineaBase {
  private readonly semestre: SemestreCursado;
  private readonly frecuencia: FrecuenciaConsumo;

  private constructor(private readonly props: LineaBaseReconstitucion) {
    this.semestre = new SemestreCursado(props.semestre);
    this.frecuencia = new FrecuenciaConsumo(props.frecuenciaConsumo);
    new FechasConsumoCoherentes(
      props.fechaInicioConsumo,
      props.fechaUltimoConsumo,
    );

    if (!Number.isInteger(props.edad) || props.edad < 14 || props.edad > 120) {
      throw new DatosLineaBaseInvalidosException(
        'La edad debe estar entre 14 y 120 años.',
      );
    }

    if (
      !props.ciudad.trim() ||
      !props.entidadEducativa.trim() ||
      !props.programaAcademico.trim()
    ) {
      throw new DatosLineaBaseInvalidosException();
    }
  }

  static crear(idUsuario: string, datos: LineaBaseDatos): LineaBase {
    const now = new Date();
    return new LineaBase({
      ...datos,
      id: randomUUID(),
      idUsuario,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
  }

  static reconstituir(props: LineaBaseReconstitucion): LineaBase {
    return new LineaBase(props);
  }

  getId(): string {
    return this.props.id;
  }

  getUsuarioId(): string {
    return this.props.idUsuario;
  }

  getCiudad(): string {
    return this.props.ciudad;
  }

  getEntidadEducativa(): string {
    return this.props.entidadEducativa;
  }

  getProgramaAcademico(): string {
    return this.props.programaAcademico;
  }

  getSemestre(): SemestreCursado {
    return this.semestre;
  }

  getNivelAcademico(): NivelAcademico {
    return this.props.nivelAcademico;
  }

  getEdad(): number {
    return this.props.edad;
  }

  getFechaInicioConsumo(): Date {
    return this.props.fechaInicioConsumo;
  }

  getFechaUltimoConsumo(): Date {
    return this.props.fechaUltimoConsumo;
  }

  getMotivoInicioConsumo(): MotivoConsumo {
    return this.props.motivoInicioConsumo;
  }

  getFrecuenciaConsumo(): FrecuenciaConsumo {
    return this.frecuencia;
  }

  getFechaCreacion(): Date {
    return this.props.fechaCreacion;
  }

  getFechaActualizacion(): Date {
    return this.props.fechaActualizacion;
  }

  toDatos(): LineaBaseDatos {
    return {
      ciudad: this.props.ciudad,
      entidadEducativa: this.props.entidadEducativa,
      programaAcademico: this.props.programaAcademico,
      semestre: this.semestre.getValue(),
      nivelAcademico: this.props.nivelAcademico,
      edad: this.props.edad,
      fechaInicioConsumo: this.props.fechaInicioConsumo,
      fechaUltimoConsumo: this.props.fechaUltimoConsumo,
      motivoInicioConsumo: this.props.motivoInicioConsumo,
      frecuenciaConsumo: this.frecuencia.getValue(),
    };
  }
}
