import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  PerfilesIncompletosException,
  SinAsignacionesVigentesException,
  SinParticipantesActivosException,
  ModalidadNoGrupalException,
} from '../../../domain/exceptions';
import { EvaluadorElegibilidadModalidad } from '../../../domain/policies/evaluador-elegibilidad-modalidad.policy';
import { PoliticaParticipanteActivoPrograma } from '../../../domain/policies/politica-participante-activo-programa.policy';
import { ModalidadProgramaRepository } from '../../../domain/repositories/modalidad-programa.repository';
import { HabilitarModalidadPersonalizadaDtoRequest } from '../../dto/modalidad-programa.dto-request';
import { TransicionModalidadDtoResponse } from '../../dto/modalidad-programa.dto-response';

@Injectable()
export class HabilitarModalidadPersonalizadaUseCase {
  private readonly evaluador = new EvaluadorElegibilidadModalidad();
  private readonly politica = new PoliticaParticipanteActivoPrograma();

  constructor(private readonly modalidades: ModalidadProgramaRepository) {}

  async execute(
    dto: HabilitarModalidadPersonalizadaDtoRequest,
    idAdministrador: string,
  ): Promise<TransicionModalidadDtoResponse> {
    if (!Number.isSafeInteger(dto.id_programa) || dto.id_programa <= 0) {
      throw new BadRequestException(
        'El identificador del programa es invalido.',
      );
    }

    if (
      typeof idAdministrador !== 'string' ||
      idAdministrador.trim().length === 0
    ) {
      throw new BadRequestException(
        'El administrador responsable es obligatorio.',
      );
    }

    if (dto.confirmacion_transicion !== true) {
      throw new BadRequestException(
        'La transicion requiere confirmacion explicita.',
      );
    }

    const vigentes =
      await this.modalidades.listarAsignacionesVigentesPorPrograma(
        dto.id_programa,
      );

    if (vigentes.length === 0) {
      throw new SinAsignacionesVigentesException();
    }

    const participantes = this.politica.filtrar(vigentes);

    const modalidadGrupal = participantes.every(
      (participante) =>
        participante.modalidad === ModalidadConversacional.GRUPAL,
    );

    const evaluacion = this.evaluador.evaluar({
      totalUsuariosActivos: participantes.length,
      conPerfilCompleto: participantes.filter(
        (participante) => participante.perfilCompleto,
      ).length,
      modalidadGrupal,
    });

    if (!modalidadGrupal) {
      throw new ModalidadNoGrupalException();
    }

    if (evaluacion.totalUsuariosActivos === 0) {
      throw new SinParticipantesActivosException();
    }

    if (!evaluacion.elegible) {
      throw new PerfilesIncompletosException(evaluacion.sinPerfilCompleto);
    }

    const fecha = new Date();
    const asignaciones = participantes.flatMap((participante) => {
      const { cerrada, nueva } = participante.asignacion.habilitarPersonalizada(
        randomUUID(),
        fecha,
        idAdministrador,
      );

      return [cerrada, nueva];
    });

    await this.modalidades.guardarAsignaciones(asignaciones);

    return TransicionModalidadDtoResponse.crear(
      dto.id_programa,
      participantes.length,
      fecha,
      idAdministrador,
    );
  }
}
