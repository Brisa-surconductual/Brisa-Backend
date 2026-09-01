import { Injectable } from '@nestjs/common';
import { RecursoContenido } from '../../domain/entities/recurso-contenido.entity';
import { ContenidoNoEncontradoException } from '../../domain/exeption/contenido-no-encontrado.exception';
import { RecursoSinModuloDestinoException } from '../../domain/exeption/recurso-sin-modulo-destino.exception';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { RecursoContenidoRepository } from '../../domain/repositories/recurso-contenido.repository';
import { CoherenciaDatosRecursoVO } from '../../domain/value-objects/coherencia-datos-recurso.vo';
import { CrearRecursoContenidoDtoRequest } from '../dto/crear-recurso-contenido.dto-request';
import { RecursoContenidoDtoResponse } from '../dto/recurso-contenido.dto-response';

@Injectable()
export class CrearRecursoContenidoUseCase {
  constructor(
    private readonly contenidoRepository: ContenidoRepository,
    private readonly recursoRepository: RecursoContenidoRepository,
  ) {}

  async execute(
    dto: CrearRecursoContenidoDtoRequest,
  ): Promise<RecursoContenidoDtoResponse> {
    const idModulos = [...new Set(dto.id_modulos)];
    if (idModulos.length === 0) {
      throw new RecursoSinModuloDestinoException();
    }

    new CoherenciaDatosRecursoVO(
      dto.tipo_recurso,
      dto.texto_contenido,
      dto.clave_almacenamiento,
    );

    const contenido = await this.contenidoRepository.buscarPorId(
      dto.id_contenido,
    );
    if (!contenido) {
      throw new ContenidoNoEncontradoException();
    }

    const recurso = RecursoContenido.crear({
      idContenido: dto.id_contenido,
      tipoRecurso: dto.tipo_recurso,
      ordenBloque: dto.orden_bloque,
      textoContenido: dto.texto_contenido,
      claveAlmacenamiento: dto.clave_almacenamiento,
      mimeType: dto.mime_type,
      tamanoBytes: dto.tamano_bytes,
      duracionSegundos: dto.duracion_segundos,
      textoAlternativo: dto.texto_alternativo,
    });
    const recursoCreado = await this.recursoRepository.crearConModulosDestino(
      recurso,
      idModulos,
    );

    return RecursoContenidoDtoResponse.crear(recursoCreado);
  }
}
