import { Injectable } from '@nestjs/common';
import { ContenidosExitentesDtoResponse } from '../../dto/contenido/contenidos-exitentes.dto-response';
import { CatalogoContenidoRepository } from '../../../domain/repositories/catalogo-contenido.repository';

@Injectable()
export class CatologoContenitosUseCase {
  constructor(private readonly catalogo: CatalogoContenidoRepository) {}

  async execute(): Promise<ContenidosExitentesDtoResponse[]> {
    return (await this.catalogo.listar()).map((contenido) =>
      ContenidosExitentesDtoResponse.fromCatalogo(contenido),
    );
  }
}
