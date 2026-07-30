import { randomUUID } from 'crypto';

export class Consentimiento {
  private constructor(
    private readonly id_consentimiento: string,
    private version_consentimiento: string,
    private vigente: boolean,
    private motivoInvalidacion: string,
    private urlContenido: string,
    private titulo: string,
  ) {}

  static crear(
    versionConsentimiento: string,
    vigente: boolean,
    urlContenido: string,
    titulo: string,
  ): Consentimiento {
    return new Consentimiento(
      randomUUID(),
      versionConsentimiento,
      vigente,
      '',
      urlContenido,
      titulo,
    );
  }

  getId(): string {
    return this.id_consentimiento;
  }

  getVigente(): boolean {
    return this.vigente;
  }
}
