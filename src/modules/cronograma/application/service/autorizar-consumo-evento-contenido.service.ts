import { Injectable } from '@nestjs/common';
import { EventoContenido } from '../../domain/entities/evento-contenido.entity';
import { ModuloEventoNoAutorizadoException } from '../../domain/exeption/modulo-evento-no-autorizado.exception';

@Injectable()
export class AutorizarConsumoEventoContenidoService {
  validar(codigoModulo: string, evento: EventoContenido): void {
    const codigoNormalizado = codigoModulo.trim().toUpperCase();
    const autorizado = evento.payload.modulos_destino.some(
      (modulo) => modulo.codigo_modulo.toUpperCase() === codigoNormalizado,
    );

    if (!autorizado) {
      throw new ModuloEventoNoAutorizadoException();
    }
  }
}
