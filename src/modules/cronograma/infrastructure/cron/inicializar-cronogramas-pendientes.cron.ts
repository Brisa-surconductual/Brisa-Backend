import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InicializarCronogramaUsuarioUseCase } from '../../application/use-cases/inicializar-cronograma-usuario.use-case';
import { CondicionesInicializacionUsuarioRepository } from '../../domain/repositories/condiciones-inicializacion-usuario.repository';
import { CronogramaUsuarioYaInicializadoException } from '../../domain/exeption/cronograma-usuario-ya-inicializado.exception';

@Injectable()
export class InicializarCronogramasPendientesCron {
  private readonly logger = new Logger(
    InicializarCronogramasPendientesCron.name,
  );
  private readonly limitePorEjecucion = 100;

  constructor(
    private readonly condicionesRepository: CondicionesInicializacionUsuarioRepository,
    private readonly inicializarCronogramaUsuarioUseCase: InicializarCronogramaUsuarioUseCase,
  ) {}

  @Cron('*/1 * * * *')
  async ejecutar(): Promise<void> {
    let idsUsuarios: string[];

    try {
      idsUsuarios =
        await this.condicionesRepository.buscarUsuariosElegiblesSinCronograma(
          this.limitePorEjecucion,
        );
    } catch {
      this.logger.error(
        'No fue posible consultar los usuarios pendientes de inicialización.',
      );
      return;
    }

    let inicializados = 0;
    let fallidos = 0;

    for (const idUsuario of idsUsuarios) {
      try {
        await this.inicializarCronogramaUsuarioUseCase.execute(idUsuario);
        inicializados += 1;
      } catch (error: unknown) {
        if (!(error instanceof CronogramaUsuarioYaInicializadoException)) {
          fallidos += 1;
        }
      }
    }

    if (inicializados > 0) {
      this.logger.log(
        `Se inicializaron ${inicializados} cronogramas de usuario automáticamente.`,
      );
    }

    if (fallidos > 0) {
      this.logger.warn(
        `No se pudieron inicializar ${fallidos} cronogramas pendientes en esta ejecución.`,
      );
    }
  }
}
