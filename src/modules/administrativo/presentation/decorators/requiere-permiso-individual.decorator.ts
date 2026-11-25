import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { AlcancePermiso } from '../../domain/enums/alcance-permiso.enum';
import {
  ALCANCE_PERMISO_KEY,
  PermisoIndividualGuard,
} from '../guards/permiso-individual.guard';

/**
 * RF-04 / RF-145: exige un permiso individual vigente con `alcance` sobre el
 * participante de la ruta. Aplicarlo en el método, para que corra después de
 * los guards de sesión y rol declarados en la clase.
 */
export const RequierePermisoIndividual = (alcance: AlcancePermiso) =>
  applyDecorators(
    SetMetadata(ALCANCE_PERMISO_KEY, alcance),
    UseGuards(PermisoIndividualGuard),
  );
