import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import {
  ConfiguracionSoloGlobalInterceptor,
  MENSAJE_SOLO_GLOBAL_KEY,
} from '../interceptors/configuracion-solo-global.interceptor';

/**
 * RF-136 / RF-137: la ruta solo acepta configuración global. Un campo por
 * usuario o participante responde 400 CONFIGURACION_SOLO_GLOBAL con `mensaje`.
 */
export const SoloConfiguracionGlobal = (mensaje: string) =>
  applyDecorators(
    SetMetadata(MENSAJE_SOLO_GLOBAL_KEY, mensaje),
    UseInterceptors(ConfiguracionSoloGlobalInterceptor),
  );
