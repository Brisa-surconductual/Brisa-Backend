
import {Injectable} from '@nestjs/common';
import {ConsentimientosRepository} from '../../domain/repositories/consetimientos.repository';
import { InformacionConsentimientoVigenteDtoResponse } from '../dto/informacion-consentimiento-vigente.dto-response';

@Injectable()
export class ObtenerContenidoVigenteUseCase {
  constructor(
    private readonly consentimientosRepository: ConsentimientosRepository,
  ) {}

  async execute(): Promise<InformacionConsentimientoVigenteDtoResponse> {
    const idConsentimientoVigente =
      await this.consentimientosRepository.obtenerIdConsitimientoVigente();
    if (!idConsentimientoVigente) {
      throw new Error('No hay consentimiento vigente');
    }

    const consentimiento = await this.consentimientosRepository.buscarPorId(
      idConsentimientoVigente,
    );
    if (!consentimiento) {
      throw new Error('Consentimiento no encontrado');
    }

    return InformacionConsentimientoVigenteDtoResponse.crearRespuesta(
      consentimiento.id_consentimiento,
      consentimiento.version_consentimiento,
      consentimiento.vigente,
      consentimiento.urlContenido,
      consentimiento.titulo,
      consentimiento.version_consentimiento
    );
  }
}
