import { UbicacionTemporalUsuario } from '../entities/ubicacion-temporal-usuario.entity';

export abstract class UbicacionTemporalUsuarioRepository {
  abstract calcular(
    idUsuario: string,
    fechaCalculo: Date,
  ): Promise<UbicacionTemporalUsuario>;
}
