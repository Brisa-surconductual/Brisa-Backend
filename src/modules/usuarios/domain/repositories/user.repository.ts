import { Usuario } from "../entities/usuarios.entity";
import {LineaBase} from "../entities/linea-bases.entity";

export abstract class UsuarioRepository{

    abstract crear(
        usuario:Usuario,
        lineaBase:LineaBase
    ):Promise<void>;



    abstract buscarPorCorreo(correo:string):Promise<Usuario | null>;

    abstract buscarPorId(id_usuario:string):Promise<Usuario | null>;
    abstract actualizar(usuario:Usuario):Promise<void>;


}