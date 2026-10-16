import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { ConsentimientosRepository } from '../../domain/repositories/consetimientos.repository';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { ActualizacionConsentimientoDtoRequest } from '../dto/actualizar-consentimiento.dto-request';

import { ActualizacionConsentimientoDtoResponse } from '../dto/actualizar-consentimiento.dto-response';

@Injectable()
export class ActualizarConsentimientoUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly consentimientosRepository: ConsentimientosRepository,
  ) {}

  async execute(
    dto: ActualizacionConsentimientoDtoRequest,
  ): Promise<ActualizacionConsentimientoDtoResponse> {
    const usuario = await this.usuarioRepository.buscarPorId(dto.idUsuario);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const consentimiento = await this.consentimientosRepository.buscarPorId(
      dto.idConsentimeinto,
    );
    if (!consentimiento || consentimiento.vigente !== true) {
      throw new BadRequestException(
        'El consentimiento seleccionado no es válido o ya no está vigente.',
      );
    }

    await this.usuarioRepository.actualizarConsentimientoYEstado(
      dto.idUsuario,
      dto.idConsentimeinto,
      EstadoRegistro.REGISTRO_COMPLETO,
    );

    return ActualizacionConsentimientoDtoResponse.crearRespuesta();
  }
}
