import { ForbiddenException } from '@nestjs/common';

export class ModuloConsultaContenidoNoAutorizadoException extends ForbiddenException {
  constructor() {
    super(
      'El módulo no está autorizado para consultar la disponibilidad de contenido.',
    );
  }
}
