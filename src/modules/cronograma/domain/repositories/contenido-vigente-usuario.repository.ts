import { ContenidoVigenteUsuario } from '../entities/contenido-vigente-usuario.entity';

export abstract class ContenidoVigenteUsuarioRepository {
  abstract consultar(
    idUsuario: string,
    fechaConsulta: Date,
  ): Promise<ContenidoVigenteUsuario[]>;
}
