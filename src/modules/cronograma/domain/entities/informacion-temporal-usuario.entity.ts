import { ContenidoVigenteUsuario } from './contenido-vigente-usuario.entity';
import { UbicacionTemporalUsuario } from './ubicacion-temporal-usuario.entity';

export class InformacionTemporalUsuario {
  constructor(
    readonly ubicacionTemporal: UbicacionTemporalUsuario,
    readonly contenidosVigentes: ContenidoVigenteUsuario[],
  ) {}
}
