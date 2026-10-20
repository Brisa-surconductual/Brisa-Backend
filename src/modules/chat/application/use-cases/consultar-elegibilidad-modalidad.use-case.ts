import { BadRequestException, Injectable } from '@nestjs/common';
import { ModalidadProgramaRepository } from '../../domain/repositories/modalidad-programa.repository';
import { EvaluadorElegibilidadModalidad } from '../../domain/services/evaluador-elegibilidad-modalidad.service';
import { PoliticaParticipanteActivoPrograma } from '../../domain/services/politica-participante-activo-programa.service';
import { ModalidadConversacional } from '../../domain/enums/arbol-conversacional.enums';

export interface ElegibilidadModalidadPrograma {
  readonly idPrograma: number;
  readonly modalidadActual: ModalidadConversacional | null;
  readonly totalUsuariosActivos: number;
  readonly conPerfilCompleto: number;
  readonly sinPerfilCompleto: number;
  readonly elegible: boolean;
}

@Injectable()
export class ConsultarElegibilidadModalidadUseCase {
  private readonly evaluador = new EvaluadorElegibilidadModalidad();
  private readonly politica = new PoliticaParticipanteActivoPrograma();

  constructor(
    private readonly modalidades: ModalidadProgramaRepository,
  ) {}

  async execute(idPrograma: number): Promise<ElegibilidadModalidadPrograma> {
    if (!Number.isSafeInteger(idPrograma) || idPrograma <= 0) {
      throw new BadRequestException('El identificador del programa es invalido.');
    }

    const asignaciones =
      await this.modalidades.listarAsignacionesVigentesPorPrograma(idPrograma);

    const participantesActivos = this.politica.filtrar(asignaciones);

    const modalidadesVigentes = [
      ...new Set(participantesActivos.map((participante) => participante.modalidad)),
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

    return {
      idPrograma,
      modalidadActual,
      ...resultado,
    };
  }
}
