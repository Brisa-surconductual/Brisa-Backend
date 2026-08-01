import { rol_enum } from "prisma/generated/edge";
import { Usuario } from "../../domain/entities/usuarios.entity";
import { $Enums } from "@prisma/client";

export class UsuarioMapper {
    static toDomain(usuario: { id_usuario: string; correo_electronico: string; contrasena_hash: string; rol: $Enums.rol_enum; estado_registro: $Enums.estado_registro_enum; estado_cuenta: $Enums.estado_cuenta_enum; fecha_registro: Date; fecha_actualizacion: Date; }): Usuario | PromiseLike<Usuario | null> | null {
        throw new Error("Method not implemented.");
    }

    static toPrisma(usuario: Usuario) {

        return {

            id_usuario: usuario.id_usuario,

            correo_electronico: usuario.correo.value, 

            contrasena_hash: usuario.contrasenaHash,

            rol: usuario.rol as rol_enum,

            estado_registro: usuario.estadoRegistro,

            estado_cuenta: usuario.estadoCuenta,

            fecha_registro: usuario.fechaRegistro,

            fecha_actualizacion: usuario.fechaActualizacion,

            consentimiendo_aceptado: usuario.consentimeintoAceptado,

            registro_consumo_aceptado: usuario.registroConsumoAceptado,

            id_consentimiento: usuario.idConsentimiento

        };

    }

}