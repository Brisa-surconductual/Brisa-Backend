import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export class ModalidadNoConfiguradaException extends NotFoundException {
  constructor() {
    super({
      codigo: 'MODALIDAD_NO_CONFIGURADA',
      message:
        'No se encontró una configuración de modalidad terapéutica para el programa.',
    });
  }
}

export class PerfilClinicoIncompletoException extends ConflictException {
  constructor() {
    super({
      codigo: 'PERFIL_CLINICO_INCOMPLETO',
      message:
        'No es posible inicializar la sesión en modalidad personalizada porque el perfil clínico del usuario está incompleto.',
    });
  }
}

export class PerfilClinicoNoDisponibleException extends InternalServerErrorException {
  constructor() {
    super({
      codigo: 'PERFIL_CLINICO_NO_DISPONIBLE',
      message:
        'No fue posible determinar el perfil clínico del usuario. Intente nuevamente más tarde.',
    });
  }
}
