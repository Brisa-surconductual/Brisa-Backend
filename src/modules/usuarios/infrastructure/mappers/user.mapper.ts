import { $Enums, rol_enum } from '@prisma/client';
import { Usuario } from '../../domain/entities/usuarios.entity';
import { EstadoCuenta } from '../../domain/enums/estado-cuenta';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { Rol } from '../../domain/enums/rol.enum';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';

export class UsuarioMapper {
    static toDomain(usuario: {
    id_usuario: string;
    correo_electronico: string;
    contrasena_hash: string;
    rol: $Enums.rol_enum;
    estado_registro: $Enums.estado_registro_enum;
    estado_cuenta: $Enums.estado_cuenta_enum;
    fecha_registro: Date;
    fecha_actualizacion: Date;
    consentimiendo_aceptado: boolean | null;
    registro_consumo_aceptado: boolean | null;
    id_consentimiento: string | null;
}): Usuario {

    if (usuario.consentimiendo_aceptado === null || usuario.registro_consumo_aceptado === null || usuario.id_consentimiento === null) {
        throw new Error("Usuario inválido: faltan datos de consentimiento.");
    }

    return new Usuario(
        usuario.id_usuario,
        new CorreoElectronico(usuario.correo_electronico),
        usuario.contrasena_hash,
        usuario.rol as unknown as Rol,
        usuario.estado_registro as unknown as EstadoRegistro,
        usuario.estado_cuenta as unknown as EstadoCuenta,
        usuario.fecha_registro,
        usuario.fecha_actualizacion,
        usuario.consentimiendo_aceptado,
        usuario.registro_consumo_aceptado,
        usuario.id_consentimiento,
    );
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
            id_consentimiento: usuario.idConsentimiento,
        };
    }
}