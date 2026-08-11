import { Usuario } from "../entities/usuarios.entity";
import {LineaBase} from "../entities/linea-bases.entity";
import {Sesion} from "../entities/sesiones.entity";

export abstract class UsuarioRepository{

    abstract crear(
        usuario:Usuario,
        lineaBase:LineaBase,
        sesion:Sesion
    ):Promise<void>;



    abstract buscarPorCorreo(correo:string):Promise<Usuario | null>;

    abstract buscarPorId(id_usuario:string):Promise<Usuario | null>;
    abstract actualizar(usuario:Usuario):Promise<void>;

    abstract crearAdministrador(usuario:Usuario):Promise<void>;

}