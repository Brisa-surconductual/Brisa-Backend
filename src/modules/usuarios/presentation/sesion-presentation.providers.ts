import { SessionAuthGuard } from './guards/session-auth.guard';
import { CsrfSessionGuard } from './guards/csrf-session.guard';
import { SessionScopeGuard } from './guards/session-scope.guard';

export const SesionPresentationProviders = [
  SessionAuthGuard,
  CsrfSessionGuard,
  SessionScopeGuard,
];
