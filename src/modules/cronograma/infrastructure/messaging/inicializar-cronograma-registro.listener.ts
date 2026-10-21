import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ESTUDIANTE_REGISTRADO } from '../../../usuarios/application/ports/registro-estudiante.publisher';
import { InicializarCronogramaUsuarioUseCase } from '../../application/use-cases/cronograma/inicializar-cronograma-usuario.use-case';
import { CronogramaUsuarioYaInicializadoException } from '../../domain/exeption/cronograma/cronograma-usuario-ya-inicializado.exception';

@Injectable()
export class InicializarCronogramaRegistroListener {
  private readonly logger = new Logger(
    InicializarCronogramaRegistroListener.name,
  );
  constructor(
    private readonly inicializar: InicializarCronogramaUsuarioUseCase,
  ) {}

  @OnEvent(ESTUDIANTE_REGISTRADO)
  async ejecutar({ idUsuario }: { idUsuario: string }): Promise<void> {
    try {
      await this.inicializar.execute(idUsuario);
    } catch (error: unknown) {
      if (error instanceof CronogramaUsuarioYaInicializadoException) return;
      // El registro ya está confirmado. El cron existente recupera los pendientes.
      this.logger.warn(
        'La asignación del cronograma quedó pendiente para reintento automático.',
      );
    }
  }
}
