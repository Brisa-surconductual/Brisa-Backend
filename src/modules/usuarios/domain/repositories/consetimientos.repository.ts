import { Consentimiento } from "../entities/consentimientos.entity"; 

export abstract class ConsentimientosRepository {
  abstract obtenerIdConsitimientoVigente(): Promise<string | null>;
  abstract buscarPorId(id_consentimiento: string,): Promise<Consentimiento | null>;
  abstract findVigentes(): Promise<Consentimiento[]>;

}