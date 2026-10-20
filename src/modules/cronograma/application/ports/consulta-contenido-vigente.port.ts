import { ContenidoVigenteDtoResponse } from '../dto/contenidoVigente/contenido-vigente.dto-response';

export type CodigoModuloConsultaContenido =
  'CHAT' | 'SEGUIM' | 'GAMIF' | 'NOTIF';

// Contrato servidor-a-servidor dentro del monolito; no recibe credenciales HTTP.
export abstract class ConsultaContenidoVigentePort {
  abstract consultar(
    idUsuario: string,
    codigoModulo: CodigoModuloConsultaContenido,
  ): Promise<ContenidoVigenteDtoResponse[]>;
}
