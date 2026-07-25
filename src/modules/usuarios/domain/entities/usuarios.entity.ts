import { randomUUID } from "crypto";
import { Rol } from "../enums/rol.enum";
import { EstadoCuenta } from "../enums/estado-cuenta";
import { EstadoRegistro } from "../enums/estado-registro.enum";
import { CorreoElectronico } from "../value-objects/correo_electronico.vo";

export class Usuario {

    private constructor(
        private readonly id_usuario: string,
        private correo: CorreoElectronico,
        private contrasenaHash: string,
        private rol: Rol,
        private estadoRegistro: EstadoRegistro,
        private estadoCuenta: EstadoCuenta,
        private readonly fechaRegistro: Date,
        private fechaActualizacion: Date, 
        private consentimeintoAceptado: boolean,
        private registroConsumoAceptado: boolean,
        private idConsentimiento: string,
    ) {}

    static crear(
        correo: CorreoElectronico,
        contrasenaHash: string,
        rol: Rol,
        estadoRegistro: EstadoRegistro,
        estadoCuenta: EstadoCuenta,
        fechaRegistro: Date = new Date(),
        consentimeintoAceptado,
        registroConsumoAceptado,
        idConsentimiento
    ): Usuario {

        return new Usuario(
            randomUUID(),
            correo,
            contrasenaHash,
            rol,
            estadoRegistro,
            estadoCuenta,
            new Date(),
            new Date(),
            consentimeintoAceptado,
            registroConsumoAceptado,
            idConsentimiento
        );

    }

    getId(): string {
        return this.id_usuario;
    }

    getCorreo(): CorreoElectronico {
        return this.correo;
    }

    getContrasenaHash(): string {
        return this.contrasenaHash;
    }

    getRol(): Rol {
        return this.rol;
    }

    getEstadoRegistro(): EstadoRegistro {
        return this.estadoRegistro;
    }

    getEstadoCuenta(): EstadoCuenta {
        return this.estadoCuenta;
    }

    getFechaRegistro(): Date {
        return this.fechaRegistro;
    }

    getFechaActualizacion(): Date {
        return this.fechaActualizacion;
    }

    activarCuenta(): void {
        this.estadoCuenta = EstadoCuenta.ACTIVA;
        this.fechaActualizacion = new Date();
    }

    bloquearCuenta(): void {
        this.estadoCuenta = EstadoCuenta.BLOQUEADA;
        this.fechaActualizacion = new Date();
    }



    cambiarCorreo(correo: CorreoElectronico): void {
        this.correo = correo;
        this.fechaActualizacion = new Date();
    }

    getConsentimientoAceptado(): boolean {
        return this.consentimeintoAceptado;
    }

    getRegistroConsumoAceptado(): boolean {
        return this.registroConsumoAceptado;
    }

    getIdConsentimiento(): string {
        return this.idConsentimiento;
    }


}