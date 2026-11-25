import { MotivoAtencionInvalidoException } from '../exceptions/gestion-alerta.exceptions';

export const LONGITUD_MINIMA_MOTIVO = 10;
export const LONGITUD_MAXIMA_MOTIVO = 500;

/**
 * Motivo con el que el equipo de psicología cambia el estado de una alerta
 * (RF-147). Obligatorio, sin espacios sobrantes y entre 10 y 500 caracteres:
 * la misma regla que `ck_alerta_motivo` en la base.
 */
export class MotivoAtencion {
  private constructor(readonly valor: string) {}

  static crear(valor: unknown): MotivoAtencion {
    const texto = typeof valor === 'string' ? valor.trim() : '';
    if (
      texto.length < LONGITUD_MINIMA_MOTIVO ||
      texto.length > LONGITUD_MAXIMA_MOTIVO
    )
      throw new MotivoAtencionInvalidoException();
    return new MotivoAtencion(texto);
  }
}
