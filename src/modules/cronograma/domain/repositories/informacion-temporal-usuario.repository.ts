import { InformacionTemporalUsuario } from '../entities/informacion-temporal-usuario.entity';

export abstract class InformacionTemporalUsuarioRepository {
  abstract consultar(
    idUsuario: string,
    fechaConsulta: Date,
  ): Promise<InformacionTemporalUsuario>;
}
