import { Injectable } from '@nestjs/common';
import { RecursoContenido } from '../../domain/entities/recurso-contenido.entity';
import { ContenidoNoEncontradoException } from '../../domain/exeption/contenido-no-encontrado.exception';
import { MetadatosRecursoNoCoincidenException } from '../../domain/exeption/metadatos-recurso-no-coinciden.exception';
import { RecursoMultimediaNoAlmacenadoException } from '../../domain/exeption/recurso-multimedia-no-almacenado.exception';
import { RecursoSinModuloDestinoException } from '../../domain/exeption/recurso-sin-modulo-destino.exception';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { RecursoContenidoRepository } from '../../domain/repositories/recurso-contenido.repository';
import { CoherenciaDatosRecursoVO } from '../../domain/value-objects/coherencia-datos-recurso.vo';
import { CoherenciaMimeTypeRecursoVO } from '../../domain/value-objects/coherencia-mime-type-recurso.vo';
import { CrearRecursoContenidoDtoRequest } from '../dto/crear-recurso-contenido.dto-request';
import { RecursoContenidoDtoResponse } from '../dto/recurso-contenido.dto-response';
import { AlmacenamientoRecursosPort } from '../ports/almacenamiento-recursos.port';

@Injectable()
export class CrearRecursoContenidoUseCase {
  constructor(
    private readonly contenidoRepository: ContenidoRepository,
    private readonly recursoRepository: RecursoContenidoRepository,
    private readonly almacenamientoRecursos: AlmacenamientoRecursosPort,
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
      dto.mime_type,
      dto.tamano_bytes,
    );

    const contenido = await this.contenidoRepository.buscarPorId(
      dto.id_contenido,
    );
    if (!contenido) {
      throw new ContenidoNoEncontradoException();
    }

    let mimeTypeNormalizado = dto.mime_type;
    if (dto.tipo_recurso !== TipoRecurso.TEXTO) {
      mimeTypeNormalizado = await this.validarArchivoAlmacenado(dto);
    }

    const recurso = RecursoContenido.crear({
      idContenido: dto.id_contenido,
      tipoRecurso: dto.tipo_recurso,
      ordenBloque: dto.orden_bloque,
      textoContenido: dto.texto_contenido,
      claveAlmacenamiento: dto.clave_almacenamiento,
      mimeType: mimeTypeNormalizado,
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

  private async validarArchivoAlmacenado(
    dto: CrearRecursoContenidoDtoRequest,
  ): Promise<string> {
    const mimeType = new CoherenciaMimeTypeRecursoVO(
      dto.tipo_recurso,
      dto.mime_type!,
    ).valor;
    const metadatos = await this.almacenamientoRecursos.obtenerMetadatos({
      idContenido: dto.id_contenido,
      claveAlmacenamiento: dto.clave_almacenamiento!,
    });

    if (!metadatos) {
      throw new RecursoMultimediaNoAlmacenadoException();
    }

    const mimeAlmacenado = metadatos.mimeType?.split(';')[0];
    if (
      mimeAlmacenado !== mimeType ||
      metadatos.tamanoBytes !== dto.tamano_bytes
    ) {
      throw new MetadatosRecursoNoCoincidenException();
    }

    return mimeType;
  }
}
