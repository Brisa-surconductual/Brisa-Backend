export class CorreoDuplicadoException extends Error {
  constructor() {
    super('La dirección de correo ingresada ya se encuentra registrada.');
    this.name = CorreoDuplicadoException.name;
  }
}

export class CorreoInvalidoException extends Error {
  constructor() {
    super('La dirección ingresada no tiene un formato de correo válido.');
    this.name = CorreoInvalidoException.name;
  }
}

export class ContrasenasNoCoincidenException extends Error {
  constructor() {
    super('La confirmación de la contraseña no coincide.');
    this.name = ContrasenasNoCoincidenException.name;
  }
}

export class ContrasenaDebilException extends Error {
  constructor() {
    super(
      'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.',
    );
    this.name = ContrasenaDebilException.name;
  }
}

export class CredencialesInvalidasException extends Error {
  constructor() {
    super(
      'Credenciales inválidas. Verifique su correo electrónico y contraseña.',
    );
    this.name = CredencialesInvalidasException.name;
  }
}

export class CuentaInactivaException extends Error {
  constructor() {
    super('La cuenta no está habilitada para iniciar sesión.');
    this.name = CuentaInactivaException.name;
  }
}

export class SesionInvalidaException extends Error {
  constructor(
    message = 'No existe una sesión activa. Inicie sesión nuevamente.',
  ) {
    super(message);
    this.name = SesionInvalidaException.name;
  }
}

export class EstadoRegistroInvalidoException extends Error {
  constructor(
    message = 'La operación no está permitida en el estado actual del registro.',
  ) {
    super(message);
    this.name = EstadoRegistroInvalidoException.name;
  }
}

export class ConsentimientoNoDisponibleException extends Error {
  constructor() {
    super('No fue posible cargar un consentimiento informado vigente.');
    this.name = ConsentimientoNoDisponibleException.name;
  }
}

export class ConsentimientoRequeridoException extends Error {
  constructor() {
    super('Debe aceptar todas las condiciones requeridas para continuar.');
    this.name = ConsentimientoRequeridoException.name;
  }
}

export class DatosLineaBaseInvalidosException extends Error {
  constructor(message = 'Los datos de línea base ingresados no son válidos.') {
    super(message);
    this.name = DatosLineaBaseInvalidosException.name;
  }
}

export class FechasConsumoIncoherentesException extends Error {
  constructor() {
    super('Se detectaron inconsistencias en las fechas de consumo.');
    this.name = FechasConsumoIncoherentesException.name;
  }
}

export class ConsentimientoNoVigenteException extends Error {
  constructor() {
    super(
      'Debe aceptar nuevamente el consentimiento antes de confirmar el registro.',
    );
    this.name = ConsentimientoNoVigenteException.name;
  }
}

export class LimiteRecuperacionExcedidoException extends Error {
  constructor() {
    super(
      'Se alcanzó el límite de solicitudes de recuperación. Intente más tarde.',
    );
    this.name = LimiteRecuperacionExcedidoException.name;
  }
}

export class CodigoRecuperacionInvalidoException extends Error {
  constructor() {
    super('El código de recuperación no es válido o ya no está disponible.');
    this.name = CodigoRecuperacionInvalidoException.name;
  }
}

export class CodigoRecuperacionExpiradoException extends Error {
  constructor() {
    super('El código de recuperación ha expirado. Solicite uno nuevo.');
    this.name = CodigoRecuperacionExpiradoException.name;
  }
}

export class AccesoDenegadoException extends Error {
  constructor() {
    super('No tiene permisos suficientes para acceder a esta funcionalidad.');
    this.name = AccesoDenegadoException.name;
  }
}
