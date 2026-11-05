import { randomUUID } from 'crypto';
import { EstadoFlujoConversacional } from '../../enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../enums/perfil-clinico.enum';
import {
  EstadoFlujoInvalidoException,
  FlujoConversacionalNoEditableException,
  PerfilClinicoArbolInvalidoException,
} from '../../exceptions';

export class FlujoConversacional {
  constructor(
    readonly idFlujo: string,
    readonly nombre: string,
    readonly modalidad: ModalidadConversacional,
    readonly estado: EstadoFlujoConversacional,
    readonly version: number,
    readonly creadoPor: string,
    readonly fechaCreacion: Date,
    readonly fechaPublicacion: Date | null,
    readonly tipoDependencia: TipoDependenciaClinica | null = null,
    readonly tipoCraving: TipoCravingClinico | null = null,
    readonly fechaArchivado: Date | null = null,
  ) {}

  static crearGrupal(
    nombre: string,
    version: number,
    creadoPor: string,
  ): FlujoConversacional {
    return new FlujoConversacional(
      randomUUID(),
      nombre,
      ModalidadConversacional.GRUPAL,
      EstadoFlujoConversacional.BORRADOR,
      version,
      creadoPor,
      new Date(),
      null,
    );
  }

  static crearPersonalizado(
    nombre: string,
    tipoDependencia: TipoDependenciaClinica,
    tipoCraving: TipoCravingClinico,
    version: number,
    creadoPor: string,
  ): FlujoConversacional {
    FlujoConversacional.validarPerfil(tipoDependencia, tipoCraving);
    return new FlujoConversacional(
      randomUUID(),
      nombre,
      ModalidadConversacional.PERSONALIZADA,
      EstadoFlujoConversacional.BORRADOR,
      version,
      creadoPor,
      new Date(),
      null,
      tipoDependencia,
      tipoCraving,
    );
  }

  static validarPerfil(tipoDependencia: unknown, tipoCraving: unknown): void {
    if (
      !Object.values(TipoDependenciaClinica).includes(
        tipoDependencia as TipoDependenciaClinica,
      ) ||
      !Object.values(TipoCravingClinico).includes(
        tipoCraving as TipoCravingClinico,
      )
    ) {
      throw new PerfilClinicoArbolInvalidoException();
    }
  }

  get esEditable(): boolean {
    return this.estado === EstadoFlujoConversacional.BORRADOR;
  }

  get estaArchivado(): boolean {
    return this.estado === EstadoFlujoConversacional.ARCHIVADO;
  }

  asegurarEditable(): void {
    if (!this.esEditable) throw new FlujoConversacionalNoEditableException();
  }

  /** Valida y devuelve el perfil clínico de un flujo personalizado. */
  perfilClinico(): {
    tipoDependencia: TipoDependenciaClinica;
    tipoCraving: TipoCravingClinico;
  } {
    FlujoConversacional.validarPerfil(this.tipoDependencia, this.tipoCraving);
    return {
      tipoDependencia: this.tipoDependencia as TipoDependenciaClinica,
      tipoCraving: this.tipoCraving as TipoCravingClinico,
    };
  }

  publicar(fecha: Date = new Date()): FlujoConversacional {
    if (!this.esEditable) throw new EstadoFlujoInvalidoException();
    return this.conEstado(EstadoFlujoConversacional.PUBLICADO, {
      fechaPublicacion: fecha,
    });
  }

  archivar(fecha: Date = new Date()): FlujoConversacional {
    if (this.estaArchivado) throw new EstadoFlujoInvalidoException();
    return this.conEstado(EstadoFlujoConversacional.ARCHIVADO, {
      fechaArchivado: fecha,
    });
  }

  /** Nueva versión en borrador con el mismo nombre, modalidad y perfil. */
  clonarComoBorrador(version: number, creadoPor: string): FlujoConversacional {
    return new FlujoConversacional(
      randomUUID(),
      this.nombre,
      this.modalidad,
      EstadoFlujoConversacional.BORRADOR,
      version,
      creadoPor,
      new Date(),
      null,
      this.tipoDependencia,
      this.tipoCraving,
    );
  }

  private conEstado(
    estado: EstadoFlujoConversacional,
    fechas: { fechaPublicacion?: Date; fechaArchivado?: Date },
  ): FlujoConversacional {
    return new FlujoConversacional(
      this.idFlujo,
      this.nombre,
      this.modalidad,
      estado,
      this.version,
      this.creadoPor,
      this.fechaCreacion,
      fechas.fechaPublicacion ?? this.fechaPublicacion,
      this.tipoDependencia,
      this.tipoCraving,
      fechas.fechaArchivado ?? this.fechaArchivado,
    );
  }
}
