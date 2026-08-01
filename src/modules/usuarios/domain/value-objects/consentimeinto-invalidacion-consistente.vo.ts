export class consentimeintoInvalidacion {
    constructor(
        readonly vigente: boolean,
        readonly fecha_invalidacion: Date
    )  {
        if(vigente === true && fecha_invalidacion == null){
            throw new Error("Si el consentimiento es vigente, la fecha de invalidación debe ser nula.");
        }
        if(vigente === false && fecha_invalidacion != null){
            throw new Error("Si el consentimiento no es vigente, la fecha de invalidación no debe ser nula.");
        }
    }  
}