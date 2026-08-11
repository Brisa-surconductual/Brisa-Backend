import { randomUUID } from "crypto";
import { Rol } from "../enums/rol.enum";
import { EstadoCuenta } from "../enums/estado-cuenta";
import { EstadoRegistro } from "../enums/estado-registro.enum";
import { CorreoElectronico } from "../value-objects/correo_electronico.vo";

export class Usuario {

    constructor(
        readonly id_usuario: string,
        readonly correo: CorreoElectronico,
        readonly contrasenaHash: string,
        readonly rol: Rol,
        readonly estadoRegistro: EstadoRegistro,
        readonly estadoCuenta: EstadoCuenta,
        readonly fechaRegistro: Date,
        readonly fechaActualizacion: Date, 
        readonly consentimeintoAceptado: boolean,
        readonly registroConsumoAceptado: boolean,
        readonly idConsentimiento: string,
    ) {}

    static crearEstudiante(
        correo: CorreoElectronico,
        contrasenaHash: string,
        idConsentimiento: string,
    ): Usuario {
        return new Usuario(
            randomUUID(),
            correo,
            contrasenaHash,
            Rol.ESTUDIANTE,
            EstadoRegistro.REGISTRO_COMPLETO,
            EstadoCuenta.ACTIVA,
            new Date(),
            new Date(),
            true,
            true,
            idConsentimiento
        );

    }

    static actualizarContrasena(
        usuario: Usuario,
        nuevaContrasenaHash: string,
    ): Usuario {
        return new Usuario(
            usuario.id_usuario,
            usuario.correo,
            nuevaContrasenaHash,
            usuario.rol,
            usuario.estadoRegistro,
            usuario.estadoCuenta,
            usuario.fechaRegistro,
            new Date(),
            usuario.consentimeintoAceptado,
            usuario.registroConsumoAceptado,
            usuario.idConsentimiento,
        );
    }
}