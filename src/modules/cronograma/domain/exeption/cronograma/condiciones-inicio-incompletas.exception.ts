import { BadRequestException } from '@nestjs/common';

export class CondicionesInicioIncompletasException extends BadRequestException {
  constructor() {
    super(
      'El usuario no cumple con las condiciones necesarias para iniciar el programa.',
    );
  }
}
