import { Injectable } from '@nestjs/common';
import { Script } from 'node:vm';
import { ComprobarFormatoRespuestaPort } from '../../application/ports/procesar-respuesta.port';
import { ConfiguracionRespuestaInvalida } from '../../domain/policies/motor-respuesta-conversacional.policy';

// El programa es fijo. Patrón y respuesta son datos, nunca código interpolado.
const COMPROBAR = new Script('new RegExp(patron).test(texto)');

@Injectable()
export class FormatoRespuestaAdapter implements ComprobarFormatoRespuestaPort {
  coincide(patron: string, texto: string): boolean {
    try {
      if (patron.length > 4096 || texto.length > 8192)
        throw new Error('Límite de formato');
      const resultado: unknown = COMPROBAR.runInNewContext(
        { patron, texto },
        {
          timeout: 500,
          contextCodeGeneration: { strings: false, wasm: false },
        },
      );
      return resultado === true;
    } catch {
      throw new ConfiguracionRespuestaInvalida(
        'FORMATO_VALIDACION_NO_DISPONIBLE',
        'No fue posible aplicar el formato de validación configurado.',
      );
    }
  }
}
