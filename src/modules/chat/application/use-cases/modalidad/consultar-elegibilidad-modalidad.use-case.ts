import { Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { EvaluadorElegibilidadModalidad } from '../../../domain/policies/evaluador-elegibilidad-modalidad.policy';
import { PoliticaParticipanteActivoPrograma } from '../../../domain/policies/politica-participante-activo-programa.policy';
import { ModalidadProgramaRepository } from '../../../domain/repositories/modalidad-programa.repository';
import { ElegibilidadModalidadDtoResponse } from '../../dto/modalidad-programa.dto-response';

/**
 * RF-25B: resumen de verificación previo a la transición. Cuenta los
 * usuarios activos y cuántos tienen perfil clínico completo.
 */
@Injectable()
export class ConsultarElegibilidadModalidadUseCase {
  private readonly evaluador = new EvaluadorElegibilidadModalidad();
  private readonly politica = new PoliticaParticipanteActivoPrograma();

  constructor(private readonly modalidades: ModalidadProgramaRepository) {}

  async execute(): Promise<ElegibilidadModalidadDtoResponse> {
    const asignaciones = await this.modalidades.listarAsignacionesVigentes();
    const participantesActivos = this.politica.filtrar(asignaciones);

    const modalidadesVigentes = [
      ...new Set(
        participantesActivos.map((participante) => participante.modalidad),
      ),
    ];
    // Ante modalidades mixtas o ausencia de asignaciones,
    // no se presupone una modalidad.
    const modalidadActual =
      modalidadesVigentes.length === 1 ? modalidadesVigentes[0] : null;

    const resultado = this.evaluador.evaluar({
      totalUsuariosActivos: participantesActivos.length,
      conPerfilCompleto: participantesActivos.filter(
        (participante) => participante.perfilCompleto,
      ).length,
      modalidadGrupal: modalidadActual === ModalidadConversacional.GRUPAL,
    });

    return ElegibilidadModalidadDtoResponse.crear(modalidadActual, resultado);
  }
}
