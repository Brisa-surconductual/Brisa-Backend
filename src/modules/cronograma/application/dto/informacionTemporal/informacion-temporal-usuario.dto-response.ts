import { InformacionTemporalUsuario } from '../../../domain/entities/informacion-temporal-usuario.entity';
import { ContenidoVigenteDtoResponse } from '../contenidoVigente/contenido-vigente.dto-response';
import { UbicacionTemporalUsuarioDtoResponse } from '../cronograma/ubicacion-temporal-usuario.dto-response';

export class InformacionTemporalUsuarioDtoResponse {
  ubicacion_temporal!: UbicacionTemporalUsuarioDtoResponse;
  contenidos_vigentes!: ContenidoVigenteDtoResponse[];

  static crear(
    informacion: InformacionTemporalUsuario,
  ): InformacionTemporalUsuarioDtoResponse {
    return {
      ubicacion_temporal: UbicacionTemporalUsuarioDtoResponse.crear(
        informacion.ubicacionTemporal,
      ),
      contenidos_vigentes: informacion.contenidosVigentes.map((contenido) =>
        ContenidoVigenteDtoResponse.crear(contenido),
      ),
    };
  }
}
