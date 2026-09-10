export abstract class ModuloInternoCredentialsConfigPort {
  abstract obtenerApiKeyHash(codigoModulo: string): string | null;
}
