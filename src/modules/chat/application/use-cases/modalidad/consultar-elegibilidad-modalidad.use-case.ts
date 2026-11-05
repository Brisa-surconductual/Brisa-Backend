import { BadRequestException, Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { EvaluadorElegibilidadModalidad } from '../../../domain/policies/evaluador-elegibilidad-modalidad.policy';
import { PoliticaParticipanteActivoPrograma } from '../../../domain/policies/politica-participante-activo-programa.policy';
import { ModalidadProgramaRepository } from '../../../domain/repositories/modalidad-programa.repository';
import { ConsultarElegibilidadModalidadDtoRequest } from '../../dto/modalidad-programa.dto-request';
import { ElegibilidadModalidadDtoResponse } from '../../dto/modalidad-programa.dto-response';

/**
 * RF-25B: resumen de verificación previo a la transición. Cuenta los usuarios
 * activos del programa y cuántos tienen perfil clínico completo.
 */
@Injectable()
export class ConsultarElegibilidadModalidadUseCase {
  private readonly evaluador = new EvaluadorElegibilidadModalidad();
  private readonly politica = new PoliticaParticipanteActivoPrograma();

  constructor(private readonly modalidades: ModalidadProgramaRepository) {}

  async execute(
    dto: ConsultarElegibilidadModalidadDtoRequest,
  ): Promise<ElegibilidadModalidadDtoResponse> {
    const idPrograma = dto.id_programa;
    if (!Number.isSafeInteger(idPrograma) || idPrograma <= 0) {
      throw new BadRequestException(
        'El identificador del programa es invalido.',
      );
    }

    const asignaciones =
      await this.modalidades.listarAsignacionesVigentesPorPrograma(idPrograma);
    const participantesActivos = this.politica.filtrar(asignaciones);

    const modalidadesVigentes = [
      ...new Set(
        participantesActivos.map((participante) => participante.modalidad),
      ),
    ];
    // Ante modalidades mixtas o ausencia de asignaciones,
    // no se presupone una modalidad a nivel de programa.
    const modalidadActual =
      modalidadesVigentes.length === 1 ? modalidadesVigentes[0] : null;

    const resultado = this.evaluador.evaluar({
      totalUsuariosActivos: participantesActivos.length,
      conPerfilCompleto: participantesActivos.filter(
        (participante) => participante.perfilCompleto,
      ).length,
      modalidadGrupal: modalidadActual === ModalidadConversacional.GRUPAL,
    });

    return ElegibilidadModalidadDtoResponse.crear(
      idPrograma,
      modalidadActual,
      resultado,
    );
  }
}
