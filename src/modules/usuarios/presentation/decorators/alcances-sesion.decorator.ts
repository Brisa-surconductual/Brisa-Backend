import { SetMetadata } from '@nestjs/common';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';

export const ALCANCES_SESION_KEY = 'alcances_sesion';

export const AlcancesSesion = (...alcances: AlcanceSesion[]) =>
  SetMetadata(ALCANCES_SESION_KEY, alcances);
