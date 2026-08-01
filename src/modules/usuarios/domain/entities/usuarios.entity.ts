import { randomUUID } from "crypto";
import { Rol } from "../enums/rol.enum";
import { EstadoCuenta } from "../enums/estado-cuenta";
import { EstadoRegistro } from "../enums/estado-registro.enum";
import { CorreoElectronico } from "../value-objects/correo_electronico.vo";

export class Usuario {

    private constructor(
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

}