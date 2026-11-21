import { DomainException } from './domain.exception';

export class SinSesionConversacionalException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'No existe una sesión conversacional disponible para obtener el perfil clínico del usuario.',
      'SIN_SESION_CONVERSACIONAL',
    );
  }
}

export class ValorClinicoInvalidoException extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor() {
    super(
      'El perfil clínico contiene valores no válidos.',
      'VALOR_CLINICO_INVALIDO',
    );
  }
}
