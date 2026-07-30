import { randomUUID } from 'node:crypto';
import { EstadoCuenta } from '../enums/estado-cuenta';
import { EstadoRegistro } from '../enums/estado-registro.enum';
import { Rol } from '../enums/rol.enum';
import { CorreoElectronico } from '../value-objects/correo_electronico.vo';

export interface UsuarioReconstitucion {
  id: string;
  correo: CorreoElectronico;
  contrasenaHash: string;
  rol: Rol;
  estadoRegistro: EstadoRegistro;
  estadoCuenta: EstadoCuenta;
  fechaRegistro: Date;
  fechaActualizacion: Date;
  consentimientoAceptado: boolean;
  registroConsumoAceptado: boolean;
  idConsentimiento: string | null;
}

export class Usuario {
  private constructor(private readonly props: UsuarioReconstitucion) {}

  static crear(correo: CorreoElectronico, contrasenaHash: string): Usuario {
    const now = new Date();

    return new Usuario({
      id: randomUUID(),
      correo,
      contrasenaHash,
      rol: Rol.ESTUDIANTE,
      estadoRegistro: EstadoRegistro.PENDIENTE_CONSENTIMIENTO,
      estadoCuenta: EstadoCuenta.ACTIVA,
      fechaRegistro: now,
      fechaActualizacion: now,
      consentimientoAceptado: false,
      registroConsumoAceptado: false,
      idConsentimiento: null,
    });
  }

  static reconstituir(props: UsuarioReconstitucion): Usuario {
    return new Usuario(props);
  }

  getId(): string {
    return this.props.id;
  }

  getCorreo(): CorreoElectronico {
    return this.props.correo;
  }

  getContrasenaHash(): string {
    return this.props.contrasenaHash;
  }

  getRol(): Rol {
    return this.props.rol;
  }

  getEstadoRegistro(): EstadoRegistro {
    return this.props.estadoRegistro;
  }

  getEstadoCuenta(): EstadoCuenta {
    return this.props.estadoCuenta;
  }

  getFechaRegistro(): Date {
    return this.props.fechaRegistro;
  }

  getFechaActualizacion(): Date {
    return this.props.fechaActualizacion;
  }

  getConsentimientoAceptado(): boolean {
    return this.props.consentimientoAceptado;
  }

  getRegistroConsumoAceptado(): boolean {
    return this.props.registroConsumoAceptado;
  }

  getIdConsentimiento(): string | null {
    return this.props.idConsentimiento;
  }

  actualizarContrasena(hash: string): void {
    this.props.contrasenaHash = hash;
    this.props.fechaActualizacion = new Date();
  }

  marcarPendienteRevision(idConsentimiento: string): void {
    this.props.idConsentimiento = idConsentimiento;
    this.props.consentimientoAceptado = true;
    this.props.registroConsumoAceptado = true;
    this.props.estadoRegistro = EstadoRegistro.PENDIENTE_REVISION;
    this.props.fechaActualizacion = new Date();
  }

  invalidarConsentimiento(): void {
    this.props.consentimientoAceptado = false;
    this.props.registroConsumoAceptado = false;
    this.props.estadoRegistro = EstadoRegistro.PENDIENTE_CONSENTIMIENTO;
    this.props.fechaActualizacion = new Date();
  }

  completarRegistro(): void {
    this.props.estadoRegistro = EstadoRegistro.REGISTRO_COMPLETO;
    this.props.fechaActualizacion = new Date();
  }
}
