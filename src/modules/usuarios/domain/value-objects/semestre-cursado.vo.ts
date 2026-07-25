export class semestreCursado{
    constructor(
        private readonly semestre_cursado: number
    ){
        if(semestre_cursado < 1 || semestre_cursado > 20){
            throw new Error("El semestre cursado debe estar entre 1 y 20.");
        }
    }

    getValue(): number {
        return this.semestre_cursado;
    }
}