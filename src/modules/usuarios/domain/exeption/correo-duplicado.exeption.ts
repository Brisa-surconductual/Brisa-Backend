export class CorreoDuplicadoException extends Error{

    constructor(){

        super("Ya existe un usuario registrado con ese correo.");

    }

}