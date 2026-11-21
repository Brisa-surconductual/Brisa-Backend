import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SesionConversacionalNoEncontradaException } from '../../../domain/exceptions/sesion.exceptions';
import {
  ErrorClienteConversacional,
  RegistroErroresConversacionalesRepository,
} from '../../../domain/repositories/registro-errores-conversacionales.repository';

@Injectable()
export class ReportarErrorConversacionalUseCase {
  constructor(
    private readonly registro: RegistroErroresConversacionalesRepository,
  ) {}

  async execute(error: ErrorClienteConversacional): Promise<void> {
    const resultado = await this.registro.registrarCliente(error);
    if (resultado === 'LIMITE')
      throw new HttpException(
        { codigo: 'LIMITE_REPORTES' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    if (resultado === 'SESION_NO_ENCONTRADA')
      throw new SesionConversacionalNoEncontradaException();
  }
}
