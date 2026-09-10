import { Injectable } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';
import { ModuloApiKeyHasherPort } from '../../application/ports/modulo-api-key-hasher.port';

@Injectable()
export class Sha256ModuloApiKeyHasher implements ModuloApiKeyHasherPort {
  comparar(apiKey: string, hashEsperado: string): boolean {
    if (
      apiKey.length < 32 ||
      apiKey.length > 512 ||
      !/^[0-9a-f]{64}$/i.test(hashEsperado)
    ) {
      return false;
    }

    const calculado = createHash('sha256').update(apiKey).digest();
    const esperado = Buffer.from(hashEsperado, 'hex');

    return (
      calculado.length === esperado.length &&
      timingSafeEqual(calculado, esperado)
    );
  }
}
