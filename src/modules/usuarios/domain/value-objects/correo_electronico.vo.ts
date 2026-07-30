import { CorreoInvalidoException } from '../exceptions/usuario.exceptions';

export class CorreoElectronico {
  readonly value: string;

  constructor(value: string) {
    const normalized = value.trim().toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(normalized) || normalized.length > 255) {
      throw new CorreoInvalidoException();
    }

    this.value = normalized;
  }

  getValue(): string {
    return this.value;
  }
}
