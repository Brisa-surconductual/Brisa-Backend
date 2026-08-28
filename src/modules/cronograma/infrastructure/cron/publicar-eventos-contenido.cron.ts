import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PublicarEventosCambioEstadoUseCase } from '../../application/use-cases/publicar-eventos-cambio-estado.use-case';

@Injectable()
export class PublicarEventosContenidoCron {
  private readonly logger = new Logger(PublicarEventosContenidoCron.name);
  private ejecutando = false;

  constructor(
    private readonly publicarEventosUseCase: PublicarEventosCambioEstadoUseCase,
  ) {}

  @Cron('* * * * * *', { name: 'publicar-eventos-cambio-estado-contenido' })
  async ejecutar(): Promise<void> {
    if (this.ejecutando) {
      return;
    }

    this.ejecutando = true;
    const inicio = Date.now();

    try {
      const resultado = await this.publicarEventosUseCase.execute(new Date());
      const duracion = Date.now() - inicio;

      if (resultado.eventos_publicados > 0) {
        this.logger.log(
          `Se publicaron ${resultado.eventos_publicados} eventos de contenido en ${duracion} ms.`,
        );
      }

      if (resultado.cambios_invalidos > 0) {
        this.logger.warn(
          `Se omitieron ${resultado.cambios_invalidos} cambios de estado inválidos.`,
        );
      }

      if (duracion >= 2000) {
        this.logger.warn(
          `La generación de eventos tardó ${duracion} ms y superó el objetivo de RF-15.`,
        );
      }
    } catch (error: unknown) {
      const detalle =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`No fue posible publicar los eventos: ${detalle}`);
    } finally {
      this.ejecutando = false;
    }
  }
}
