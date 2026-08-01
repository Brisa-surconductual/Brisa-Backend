export class lineaBaseFechasFueraRangoException extends Error{

    constructor(){

        super("Las fechas de la línea base están fuera del rango permitido.");

    }

}