import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExpirarSesionesUseCase } from '../../application/use-cases/expirar-sesiones.use-case';

@Injectable()
export class ExpirarSesionesCron {
  private readonly logger = new Logger(ExpirarSesionesCron.name);

  constructor(
    private readonly expirarSesionesUseCase: ExpirarSesionesUseCase,
  ) {}

  @Cron('*/1 * * * *')
  async ejecutar(): Promise<void> {
    const resultado = await this.expirarSesionesUseCase.execute();
    const total = resultado.inactividad + resultado.segundoPlano;

    if (total > 0) {
      this.logger.log(
        `Se cerraron ${resultado.inactividad} sesiones por inactividad y ${resultado.segundoPlano} por segundo plano.`,
      );
    }
  }
}
