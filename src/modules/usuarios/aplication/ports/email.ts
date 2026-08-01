export abstract class EmailService {
  abstract enviarRecuperacionContrasena(
    correo: string,
    token: string,
  ): Promise<void>;
}