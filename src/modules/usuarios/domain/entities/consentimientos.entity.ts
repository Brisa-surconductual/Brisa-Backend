import { randomUUID } from "crypto";

export class Consentimiento {

     constructor(

        readonly id_consentimiento: string,
        readonly version_consentimiento: string,
        readonly vigente: boolean,
        readonly motivoInvalidacion: string,
        readonly urlContenido: string,
        readonly titulo: string,
        readonly fechaInvalidacion?: Date | null

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
            "",
            urlContenido,
            titulo

        );

    }

    getId(): string {
        return this.id_consentimiento;
    }



    getVigente(): boolean {
        return this.vigente;
    }

    validarVigencia(): void {
        if (!this.vigente) {
            throw new Error("El consentimiento no es vigente");
        }
    }



}