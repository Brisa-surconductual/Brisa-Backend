export class AuditoriaArbolConversacional {
  constructor(
    readonly idAuditoria: bigint,
    readonly idFlujo: string,
    readonly idActor: string,
    readonly accion: string,
    readonly idObjeto: string | null,
    readonly fechaOperacion: Date,
  ) {}
}
