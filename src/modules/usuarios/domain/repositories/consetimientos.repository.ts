import { Consentimiento } from "../entities/consentimientos.entity"; 

export abstract class ConsentimientosRepository{

    abstract obtenerIdConsitimientoVigente (): Promise<string | null>;

}