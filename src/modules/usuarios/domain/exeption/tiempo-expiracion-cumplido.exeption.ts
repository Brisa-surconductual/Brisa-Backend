export class tiempoExpiracionCumplidoException extends Error{

    constructor(){
        super("El tiempo de expiración ha sido cumplido.");
    }
}