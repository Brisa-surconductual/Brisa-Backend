import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { RecoveryTokenService } from '../../application/ports/recovery-token.service';

@Injectable()
export class NodeRecoveryTokenService implements RecoveryTokenService {
  generar(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
