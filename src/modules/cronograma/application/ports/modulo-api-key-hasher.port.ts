export abstract class ModuloApiKeyHasherPort {
  abstract comparar(apiKey: string, hashEsperado: string): boolean;
}
