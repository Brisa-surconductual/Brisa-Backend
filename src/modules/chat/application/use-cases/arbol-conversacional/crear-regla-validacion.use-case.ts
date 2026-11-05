import { Injectable } from '@nestjs/common';
import { ReglaValidacion } from '../../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { ReglaValidacionDtoRequest } from '../../dto/arbol-conversacional.dto-request';
import { ReglaValidacionDtoResponse } from '../../dto/chat-admin.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25 / RF-28: crea una regla de validación reutilizable por varias transiciones. */
@Injectable()
export class CrearReglaValidacionUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    dto: ReglaValidacionDtoRequest,
    idActor: string,
  ): Promise<ReglaValidacionDtoResponse> {
    return ejecutarSeguro(async () => {
      const regla = ReglaValidacion.crear(
        dto.tipo_dato,
        dto.obligatorio ?? true,
        dto.valor_min ?? null,
        dto.valor_max ?? null,
        dto.formato_regex ?? null,
        dto.valores_permitidos ?? [],
        dto.mensaje_error.trim(),
      );
      await this.repository.guardarReglaValidacion(regla, idActor);
      return ReglaValidacionDtoResponse.crear(regla);
    });
  }
}
