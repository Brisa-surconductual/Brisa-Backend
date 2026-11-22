/** RF-30B: versión global de la taxonomía ("mayor.menor"). */
export class VersionTaxonomia {
  private constructor(
    readonly mayor: number,
    readonly menor: number,
  ) {}

  static de(texto: string): VersionTaxonomia {
    const partes = /^(\d+)\.(\d+)$/.exec(texto);
    if (partes === null)
      throw new Error(`Versión de taxonomía inválida: ${texto}`);
    return new VersionTaxonomia(Number(partes[1]), Number(partes[2]));
  }

  /** Cada escritura administrativa sube la versión menor. */
  siguiente(): VersionTaxonomia {
    return new VersionTaxonomia(this.mayor, this.menor + 1);
  }

  toString(): string {
    return `${this.mayor}.${this.menor}`;
  }
}
