import { Permiso } from '../enums/permiso.enum';
import { Rol } from '../enums/rol.enum';

const permisosPorRol: Readonly<Record<Rol, readonly Permiso[]>> = {
  [Rol.ESTUDIANTE]: [
    Permiso.COMPLETAR_REGISTRO,
    Permiso.USAR_FUNCIONALIDADES_PERSONALES,
  ],
  [Rol.ADMINISTRATIVO]: [Permiso.CONSULTAR_ESTADISTICAS_AGREGADAS],
};

export function obtenerPermisosPorRol(rol: Rol): readonly Permiso[] {
  return permisosPorRol[rol] ?? [];
}

export function rolTienePermiso(rol: Rol, permiso: Permiso): boolean {
  return obtenerPermisosPorRol(rol).includes(permiso);
}
