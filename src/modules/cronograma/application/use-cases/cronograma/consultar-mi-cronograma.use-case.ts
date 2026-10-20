import { Injectable } from '@nestjs/common';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
import { CronogramaUsuarioRepository } from '../../../domain/repositories/cronograma-usuario.repository';
import { CronogramaUsuarioNoAsignadoException } from '../../../domain/exeption/cronograma/cronograma-usuario-no-asignado.exception';

@Injectable()
export class ConsultarMiCronogramaUseCase {
  constructor(
    private readonly asignaciones: CronogramaUsuarioRepository,
    private readonly cronogramas: CronogramaRepository,
  ) {}

  async execute(idUsuario: string) {
    const asignacion = await this.asignaciones.buscarPorUsuario(idUsuario);
    if (!asignacion) throw new CronogramaUsuarioNoAsignadoException();
    const cronograma = await this.cronogramas.buscarPorId(
      asignacion.id_cronograma,
    );
    return {
      id_cronograma: cronograma.id_cronograma,
      nombre: cronograma.nombre_cronograma,
      estado: cronograma.estado,
      fecha_inicio_usuario: asignacion.fecha_inicio_usuario,
    };
  }
}
