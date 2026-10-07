import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SessionTokenGenerator } from '../../application/ports/session-token-generator';

@Injectable()
export class CryptoSessionTokenGenerator implements SessionTokenGenerator {
  generarToken(): string {
    return randomBytes(32).toString('base64url');
  }
}
