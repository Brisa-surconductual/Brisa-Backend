export interface ContextoErrorConversacional {
  xRequestId: string;
  codigo: string;
  idUsuario: string | null;
  idSesion: string | null;
}

export interface ErrorBackendConversacional extends ContextoErrorConversacional {
  statusHttp: number;
}

export interface ErrorClienteConversacional extends ContextoErrorConversacional {
  idUsuario: string;
}

export abstract class RegistroErroresConversacionalesRepository {
  abstract registrarBackend(error: ErrorBackendConversacional): Promise<void>;
  abstract registrarCliente(
    error: ErrorClienteConversacional,
  ): Promise<'REGISTRADO' | 'LIMITE' | 'SESION_NO_ENCONTRADA'>;
}
