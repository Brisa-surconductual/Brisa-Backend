import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { normalizarCodigoParticipante } from '../../domain/policies/codigo-participante.policy';

/**
 * RF-38 (M-8): valida el seudónimo A7 de la ruta y lo normaliza a mayúscula.
 * Rechaza cualquier otro formato, incluido un UUID interno del estudiante.
 */
@Injectable()
export class CodigoParticipantePipe implements PipeTransform<unknown, string> {
  transform(valor: unknown): string {
    const codigo = normalizarCodigoParticipante(valor);
    if (codigo === null) throw new BadRequestException();
    return codigo;
  }
}
