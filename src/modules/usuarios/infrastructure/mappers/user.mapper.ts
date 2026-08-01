import { rol_enum } from "prisma/generated/edge";
import { Usuario } from "../../domain/entities/usuarios.entity";
import { $Enums } from "@prisma/client";

export class UsuarioMapper {
    static toDomain(usuario: { id_usuario: string; correo_electronico: string; contrasena_hash: string; rol: $Enums.rol_enum; estado_registro: $Enums.estado_registro_enum; estado_cuenta: $Enums.estado_cuenta_enum; fecha_registro: Date; fecha_actualizacion: Date; }): Usuario | PromiseLike<Usuario | null> | null {
        throw new Error("Method not implemented.");
    }

    static toPrisma(usuario: Usuario) {

        return {

            id_usuario: usuario.getId(),

            correo_electronico: usuario.getCorreo().getValue(), 

            contrasena_hash: usuario.getContrasenaHash(),

            rol: usuario.getRol() as rol_enum,

            estado_registro: usuario.getEstadoRegistro(),

            estado_cuenta: usuario.getEstadoCuenta(),

            fecha_registro: usuario.getFechaRegistro(),

            fecha_actualizacion: usuario.getFechaActualizacion(),

            consentimiendo_aceptado: usuario.getConsentimientoAceptado(),

            registro_consumo_aceptado: usuario.getRegistroConsumoAceptado(),

            id_consentimiento: usuario.getIdConsentimiento(),

        };

    }

}