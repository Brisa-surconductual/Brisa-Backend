export class LimiteNumeroIntentosRecuperacionException extends Error{

    constructor(){
        super("Numero máximo de intentos de recuperación alcanzado. Por favor, intente nuevamente más tarde.");
    }
}