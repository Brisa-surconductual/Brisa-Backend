export class frecuenciaConsumo{
    constructor(
        private readonly frecuencia_consumo: number
    ){
        if(frecuencia_consumo < 0){
            throw new Error("La frecuencia de consumo no puede ser negativa.");
        }
    }

    getValue(): number {
        return this.frecuencia_consumo;
    }
}