import { $Enums, Prisma } from '@prisma/client';
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
    return Usuario.reconstituir({
      id: usuario.id_usuario,
      correo: new CorreoElectronico(usuario.correo_electronico),
      contrasenaHash: usuario.contrasena_hash,
      rol: usuario.rol as Rol,
      estadoRegistro: usuario.estado_registro as EstadoRegistro,
      estadoCuenta: usuario.estado_cuenta as EstadoCuenta,
      fechaRegistro: usuario.fecha_registro,
      fechaActualizacion: usuario.fecha_actualizacion,
      consentimientoAceptado: usuario.consentimiendo_aceptado ?? false,
      registroConsumoAceptado: usuario.registro_consumo_aceptado ?? false,
      idConsentimiento: usuario.id_consentimiento,
    });
  }

  static toPrisma(usuario: Usuario): Prisma.usuariosUncheckedCreateInput {
    return {
      id_usuario: usuario.getId(),
      correo_electronico: usuario.getCorreo().getValue(),
      contrasena_hash: usuario.getContrasenaHash(),
      rol: usuario.getRol(),
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
