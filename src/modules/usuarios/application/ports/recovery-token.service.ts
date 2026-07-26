export abstract class RecoveryTokenService {
  abstract generar(): string;
  abstract hash(token: string): string;
}
