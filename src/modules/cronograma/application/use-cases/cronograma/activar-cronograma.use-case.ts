import { HttpException, Injectable } from '@nestjs/common';
import { ActivacionCronogramaRepository } from '../../../domain/repositories/activacion-cronograma.repository';
import { ValidarConsistenciaCronogramaService } from '../../service/validad-consistencia-global-cronograma.service';
import { ValidacionConsistenciaCronogramaException } from '../../../domain/exeption/cronograma/validar-consistencia-cronograma.exeption';

@Injectable()
export class ActivarCronogramaUseCase {
  constructor(
    private readonly repositorio: ActivacionCronogramaRepository,
    private readonly validador: ValidarConsistenciaCronogramaService,
  ) {}

  async execute(idCronograma: string) {
    try {
      const activo = await this.repositorio.activar(
        idCronograma,
        (estructura) => this.validador.validar(estructura),
      );
      return {
        id_cronograma: activo.id_cronograma,
        estado: activo.estado,
        es_base: activo.es_base,
        fecha_activacion: activo.fecha_activacion,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      throw new ValidacionConsistenciaCronogramaException();
    }
  }
}
