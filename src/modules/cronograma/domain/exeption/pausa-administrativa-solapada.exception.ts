import { ConflictException } from '@nestjs/common';

export class PausaAdministrativaSolapadaException extends ConflictException {
  constructor() {
    super(
      'La pausa administrativa se solapa con una pausa previamente registrada para este usuario.',
    );
  }
}
