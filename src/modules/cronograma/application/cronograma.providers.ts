import { InicializarCronogramaUsuarioUseCase } from './use-cases/inicializar-cronograma-usuario.use-case';
import {CreacionUnidadTemporalUseCase} from "./use-cases/crear-unidad-temporal.use-case";
import {ValidarSolapamientoUnidadTemporalService} from "./service/validar-solapamiento-unidad-temporal.service";
import {CalculoOrdenUnidadTemporalService} from "./service/calculo-orden-unidad-temporal.service";

export const CronogramaApplicationProviders = [
  InicializarCronogramaUsuarioUseCase,
  CreacionUnidadTemporalUseCase,
  ValidarSolapamientoUnidadTemporalService,
  CalculoOrdenUnidadTemporalService,
];
