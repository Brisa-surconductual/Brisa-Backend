import { Injectable } from '@nestjs/common';
import { ContenidoNoEncontradoException } from '../../domain/exeption/contenido-no-encontrado.exception';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { CoherenciaMimeTypeRecursoVO } from '../../domain/value-objects/coherencia-mime-type-recurso.vo';
import { SolicitarUrlSubidaRecursoDtoRequest } from '../dto/solicitar-url-subida-recurso.dto-request';
import { UrlSubidaRecursoDtoResponse } from '../dto/url-subida-recurso.dto-response';
import { AlmacenamientoRecursosPort } from '../ports/almacenamiento-recursos.port';

@Injectable()
export class SolicitarUrlSubidaRecursoUseCase {
  constructor(
    private readonly contenidoRepository: ContenidoRepository,
    private readonly almacenamientoRecursos: AlmacenamientoRecursosPort,
  ) {}

  async execute(
    dto: SolicitarUrlSubidaRecursoDtoRequest,
  ): Promise<UrlSubidaRecursoDtoResponse> {
    const mimeType = new CoherenciaMimeTypeRecursoVO(
      dto.tipo_recurso,
      dto.mime_type,
    ).valor;

    const contenido = await this.contenidoRepository.buscarPorId(
      dto.id_contenido,
    );
    if (!contenido) {
      throw new ContenidoNoEncontradoException();
    }

    const resultado = await this.almacenamientoRecursos.crearUrlSubida({
      idContenido: dto.id_contenido,
      tipoRecurso: dto.tipo_recurso,
      mimeType,
      tamanoBytes: dto.tamano_bytes,
    });

    return UrlSubidaRecursoDtoResponse.crear(resultado);
  }
}
