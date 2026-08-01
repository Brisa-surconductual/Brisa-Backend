export class CorreoElectronico{

    constructor(
        readonly value:string
    ){

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!regex.test(value)){
            throw new Error("Correo electrónico inválido.");
        }

    }

    getValue(): string {
        return this.value;
    }

}