import { Injectable } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';
import { SessionTokenHasher } from '../../application/ports/session-token-hasher';

@Injectable()
export class Sha256SessionTokenHasher implements SessionTokenHasher {
  async hash(token: string): Promise<string> {
    return createHash('sha256').update(token).digest('hex');
  }

  async compare(token: string, hash: string): Promise<boolean> {
    const calculado = Buffer.from(await this.hash(token), 'hex');
    const esperado = Buffer.from(hash, 'hex');

    return (
      calculado.length === esperado.length &&
      timingSafeEqual(calculado, esperado)
    );
  }
}
