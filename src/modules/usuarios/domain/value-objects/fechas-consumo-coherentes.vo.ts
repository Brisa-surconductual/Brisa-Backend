import { lineaBaseFechasFueraRangoException } from "../exeption/lineaBase-fechas-fuera-rango.exeption";

export class fechasConsumoCoherentes{

    constructor(
        readonly fechaInicio:Date,
        readonly fechaUltimo:Date
    ){

       if(fechaInicio > fechaUltimo){
         throw new lineaBaseFechasFueraRangoException();
       }
    }


}