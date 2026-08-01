import {SolicitudRecuperacion} from "../entities/solicitud-recuperacion.entity";

export abstract class RecuperacionRepository{
    abstract crear(solicitud: SolicitudRecuperacion): Promise<void>;
    abstract buscarEstadoDeCodigo(codigo: string): Promise<string | null>;
    abstract buscarIdUsuarioPorCorreo(correo: string): Promise<string | null>;

}