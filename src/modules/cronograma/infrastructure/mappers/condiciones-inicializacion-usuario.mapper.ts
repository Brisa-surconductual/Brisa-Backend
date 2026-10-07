import { CondicionesInicializacionUsuario } from '../../domain/entities/condiciones-inicializacion-usuario.entity';
import { EstadoRegistro } from '../../../usuarios/domain/enums/estado-registro.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';

export class CondicionesInicializacionUsuarioMapper {
  static toDomain(usuario: {
    id_usuario: string;
    rol: string;
    estado_registro: string;
    consentimiendo_aceptado: boolean | null;
    id_consentimiento: string | null;
    linea_base: { id_linea_base: string } | null;
  }): CondicionesInicializacionUsuario {
    return new CondicionesInicializacionUsuario(
      usuario.id_usuario,
      usuario.rol as Rol,
      usuario.estado_registro as EstadoRegistro,
      usuario.consentimiendo_aceptado,
      usuario.id_consentimiento,
      usuario.linea_base !== null,
    );
  }
}
