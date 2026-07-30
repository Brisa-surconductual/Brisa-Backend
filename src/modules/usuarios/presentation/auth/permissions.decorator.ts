import { SetMetadata } from '@nestjs/common';
import { Permiso } from '../../domain/enums/permiso.enum';

export const PERMISSIONS_KEY = 'required_permissions';
export const Permissions = (...permissions: Permiso[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
