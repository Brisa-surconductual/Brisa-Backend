import { CondicionesInicializacionUsuario } from '../entities/condiciones-inicializacion-usuario.entity';

export abstract class CondicionesInicializacionUsuarioRepository {
  abstract buscarPorUsuario(
    idUsuario: string,
  ): Promise<CondicionesInicializacionUsuario | null>;

  abstract buscarUsuariosElegiblesSinCronograma(
    limite: number,
  ): Promise<string[]>;
}
