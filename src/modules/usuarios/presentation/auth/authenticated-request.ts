import { Request } from 'express';
import { AccessTokenClaims } from '../../application/ports/access-token.service';

export interface AuthenticatedRequest extends Request {
  user: AccessTokenClaims;
}
