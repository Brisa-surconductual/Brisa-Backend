import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ESTUDIANTE_REGISTRADO } from '../../../usuarios/application/ports/registro-estudiante.publisher';
import { InicializarModalidadUsuarioUseCase } from '../../application/use-cases/modalidad/inicializar-modalidad-usuario.use-case';
import { ModalidadUsuarioYaInicializadaException } from '../../domain/exceptions';

@Injectable()
export class InicializarModalidadRegistroListener {
  private readonly logger = new Logger(
    InicializarModalidadRegistroListener.name,
  );

  constructor(
    private readonly inicializar: InicializarModalidadUsuarioUseCase,
  ) {}

  @OnEvent(ESTUDIANTE_REGISTRADO)
  async ejecutar({ idUsuario }: { idUsuario: string }): Promise<void> {
    try {
      await this.inicializar.execute(idUsuario);
    } catch (error: unknown) {
      if (error instanceof ModalidadUsuarioYaInicializadaException) return;
      // El registro ya está confirmado: no se bloquea por esto. Queda
      // pendiente para reintento manual/administrativo (no hay cron propio).
      this.logger.warn(
        'La asignación de modalidad terapéutica quedó pendiente para el estudiante registrado.',
      );
    }
  }
}
