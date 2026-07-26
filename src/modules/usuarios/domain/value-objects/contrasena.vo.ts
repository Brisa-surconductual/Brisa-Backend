import { ContrasenaDebilException } from '../exceptions/usuario.exceptions';

export class Contrasena {
  constructor(readonly value: string) {
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(value);

    if (
      value.length < 8 ||
      !hasUppercase ||
      !hasNumber ||
      !hasSpecialCharacter
    ) {
      throw new ContrasenaDebilException();
    }
  }
}
