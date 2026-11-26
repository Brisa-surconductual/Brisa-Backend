import { DomainException } from './domain.exception';

export class ModalidadNoConfiguradaException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super(
      'No se encontró una configuración de modalidad terapéutica para el programa.',
      'MODALIDAD_NO_CONFIGURADA',
    );
  }
}

export class PerfilClinicoIncompletoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'No es posible inicializar la sesión en modalidad personalizada porque el perfil clínico del usuario está incompleto.',
      'PERFIL_CLINICO_INCOMPLETO',
    );
  }
}
