import {SolicitudRecuperacion} from "../entities/solicitud-recuperacion.entity";

export abstract class RecuperacionRepository{
    
    abstract actualizar(solicitud: SolicitudRecuperacion): Promise<void>;
    abstract buscarPorCodigo(codigo: string): Promise<SolicitudRecuperacion | null>;
    abstract buscarIdUsuarioPorCorreo(correo: string): Promise<string | null>;
    abstract crear(solicitud: SolicitudRecuperacion): Promise<void>;
    abstract expirarCodigosVencidos(): Promise<number>;
}