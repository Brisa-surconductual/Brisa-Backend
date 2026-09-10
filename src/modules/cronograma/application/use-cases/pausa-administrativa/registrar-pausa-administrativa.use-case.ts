import { HttpException, Injectable } from '@nestjs/common';
import { PausaAdministrativa } from '../../../domain/entities/pausa-administrativa.entity';
import { CronogramaUsuarioActivoNoEncontradoException } from '../../../domain/exeption/cronograma/cronograma-usuario-activo-no-encontrado.exception';
import { FechaInicioPausaFueraRangoException } from '../../../domain/exeption/pausa-administrativa/fecha-inicio-pausa-fuera-rango.exception';
import { PausaAdministrativaSolapadaException } from '../../../domain/exeption/pausa-administrativa/pausa-administrativa-solapada.exception';
import { RegistroPausaAdministrativaException } from '../../../domain/exeption/pausa-administrativa/registro-pausa-administrativa.exception';
import { PausaAdministrativaRepository } from '../../../domain/repositories/pausa-administrativa.repository';
import { IntervaloPausaVO } from '../../../domain/value-objects/intervalo-pausa.vo';
import { RegistrarPausaAdministrativaDtoRequest } from '../../dto/pausaAdministrativa/registrar-pausa-administrativa.dto-request';
import { RegistrarPausaAdministrativaDtoResponse } from '../../dto/pausaAdministrativa/registrar-pausa-administrativa.dto-response';

@Injectable()
export class RegistrarPausaAdministrativaUseCase {
  constructor(
    private readonly pausaRepository: PausaAdministrativaRepository,
  ) {}

  async execute(
    idUsuario: string,
    idUsuarioAdministrativo: string,
    dto: RegistrarPausaAdministrativaDtoRequest,
  ): Promise<RegistrarPausaAdministrativaDtoResponse> {
    try {
      const intervalo = new IntervaloPausaVO(
        dto.fecha_inicio_pausa,
        dto.fecha_fin_pausa,
      );
      const contexto =
        await this.pausaRepository.buscarContextoCronogramaActivo(idUsuario);

      if (!contexto) {
        throw new CronogramaUsuarioActivoNoEncontradoException();
      }

      if (
        intervalo.fechaInicio < contexto.fechaInicioUsuario ||
        intervalo.fechaInicio > contexto.fechaFinUsuario
      ) {
        throw new FechaInicioPausaFueraRangoException();
      }

      const tieneDuracion = intervalo.fechaFin > intervalo.fechaInicio;
      if (
        tieneDuracion &&
        (await this.pausaRepository.existeSolapamiento(
          contexto.idCronogramaUsuario,
          intervalo.fechaInicio,
          intervalo.fechaFin,
        ))
      ) {
        throw new PausaAdministrativaSolapadaException();
      }

      const pausa = PausaAdministrativa.registrar({
        idUsuario,
        idCronogramaUsuario: contexto.idCronogramaUsuario,
        fechaInicio: intervalo.fechaInicio,
        fechaFin: intervalo.fechaFin,
        motivo: dto.motivo_pausa,
        idUsuarioAdministrativo,
      });
      const registrada = await this.pausaRepository.crear(pausa);

      return RegistrarPausaAdministrativaDtoResponse.crear(registrada);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new RegistroPausaAdministrativaException();
    }
  }
}
