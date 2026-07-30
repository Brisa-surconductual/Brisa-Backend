export interface MensajeRecuperacion {
  destinatario: string;
  token: string;
  fechaExpiracion: Date;
}

export abstract class EmailSender {
  abstract enviarRecuperacion(mensaje: MensajeRecuperacion): Promise<void>;

  abstract enviarActivacionPendiente(destinatario: string): Promise<void>;
}
