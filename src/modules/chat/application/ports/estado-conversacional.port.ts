import { ValorRespuesta } from '../../domain/policies/configuracion-entrada-respuesta';

export interface PasoConversacional {
  idSesion: string;
  idUsuario: string;
  idInteraccion: string;
  idNodoOrigen: string;
  idNodoDestino: string;
  valor: ValorRespuesta;
  timestampInteraccion: string;
  ahora: Date;
  esTerminal: boolean;
}

export interface EstadoConversacionalTransaccion {
  insertarPaso(paso: PasoConversacional): Promise<void>;
  avanzarDesdeOrigen(paso: PasoConversacional): Promise<boolean>;
  actualizarEstado(paso: PasoConversacional): Promise<void>;
  validarHistorial(idSesion: string): Promise<boolean>;
}
