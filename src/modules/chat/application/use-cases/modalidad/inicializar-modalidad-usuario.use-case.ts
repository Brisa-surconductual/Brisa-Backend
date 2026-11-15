import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AsignacionModalidad } from '../../../domain/entities/modalidad/asignacion-modalidad.entity';
import { ModalidadUsuarioYaInicializadaException } from '../../../domain/exceptions';
import { ModalidadProgramaRepository } from '../../../domain/repositories/modalidad-programa.repository';

/**
 * Asigna la modalidad GRUPAL inicial a un estudiante nuevo. Es el
 * equivalente, en chat, de InicializarCronogramaUsuarioUseCase para el
 * registro del estudiante.
 */
@Injectable()
export class InicializarModalidadUsuarioUseCase {
  constructor(private readonly modalidades: ModalidadProgramaRepository) {}

  async execute(idUsuario: string, ahora: Date = new Date()): Promise<void> {
    const yaInicializado =
      await this.modalidades.existeAsignacionVigente(idUsuario);

    if (yaInicializado) {
      throw new ModalidadUsuarioYaInicializadaException();
    }

    const asignacion = AsignacionModalidad.crearInicialGrupal(
      randomUUID(),
      idUsuario,
      ahora,
    );

    await this.modalidades.guardarAsignaciones([asignacion]);
  }
}
