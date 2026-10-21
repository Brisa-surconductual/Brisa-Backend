export const ESTUDIANTE_REGISTRADO = 'usuarios.estudiante-registrado';

export abstract class RegistroEstudiantePublisher {
  abstract publicar(idUsuario: string): Promise<void>;
}
