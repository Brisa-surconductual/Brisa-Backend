import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InicializarCronogramaUsuarioDtoResponse } from '../dto/inicializar-cronograma-usuario.dto-response';
import { CronogramaUsuario } from '../../domain/entities/cronograma-usuario.entity';
import { CondicionesInicializacionUsuarioRepository } from '../../domain/repositories/condiciones-inicializacion-usuario.repository';
import { CronogramaRepository } from '../../domain/repositories/cronograma.repository';
import { CronogramaUsuarioRepository } from '../../domain/repositories/cronograma-usuario.repository';
import { CondicionesInicioIncompletasException } from '../../domain/exeption/condiciones-inicio-incompletas.exception';
import { CronogramaBaseInactivoException } from '../../domain/exeption/cronograma-base-inactivo.exception';
import { CronogramaBaseNoDisponibleException } from '../../domain/exeption/cronograma-base-no-disponible.exception';
import { CronogramaUsuarioYaInicializadoException } from '../../domain/exeption/cronograma-usuario-ya-inicializado.exception';
import { DatosUsuarioInconsistentesException } from '../../domain/exeption/datos-usuario-inconsistentes.exception';
import { InicializacionCronogramaPersistenciaException } from '../../domain/exeption/inicializacion-cronograma-persistencia.exception';

@Injectable()
export class InicializarCronogramaUsuarioUseCase {
  private readonly logger = new Logger(
    InicializarCronogramaUsuarioUseCase.name,
  );

  constructor(
    private readonly condicionesRepository: CondicionesInicializacionUsuarioRepository,
    private readonly cronogramaRepository: CronogramaRepository,
    private readonly cronogramaUsuarioRepository: CronogramaUsuarioRepository,
  ) {}

  async execute(
    idUsuario: string,
    ahora: Date = new Date(),
  ): Promise<InicializarCronogramaUsuarioDtoResponse> {
    try {
      if (!this.esUuid(idUsuario)) {
        throw new DatosUsuarioInconsistentesException();
      }

      const condiciones =
        await this.condicionesRepository.buscarPorUsuario(idUsuario);

      if (!condiciones || !condiciones.tieneDatosConsistentes()) {
        throw new DatosUsuarioInconsistentesException();
      }

      if (!condiciones.cumpleCondicionesDeInicio()) {
        throw new CondicionesInicioIncompletasException();
      }

      const asignacionExistente =
        await this.cronogramaUsuarioRepository.buscarPorUsuario(idUsuario);

      if (asignacionExistente) {
        throw new CronogramaUsuarioYaInicializadoException();
      }

      const cronogramaBase = await this.cronogramaRepository.buscarBaseActiva();

      if (!cronogramaBase) {
        const existeBase =
          await this.cronogramaRepository.existeBaseConfigurado();

        if (existeBase) {
          throw new CronogramaBaseInactivoException();
        }

        throw new CronogramaBaseNoDisponibleException();
      }

      const asignacion = CronogramaUsuario.inicializar(
        idUsuario,
        cronogramaBase.id_cronograma,
        ahora,
      );

      await this.cronogramaUsuarioRepository.crear(asignacion);

      this.logger.log(
        `Cronograma inicializado: asignación=${asignacion.id_cronograma_usuario}, usuario=${idUsuario}, cronograma=${cronogramaBase.id_cronograma}.`,
      );

      return InicializarCronogramaUsuarioDtoResponse.crear(
        asignacion,
        cronogramaBase,
      );
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InicializacionCronogramaPersistenciaException();
    }
  }

  private esUuid(valor: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      valor,
    );
  }
}
