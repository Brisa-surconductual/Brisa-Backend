import { Injectable } from '@nestjs/common';
import { ActualizacionRecursoInvalidaException } from '../../../domain/exeption/recurso-contenido/actualizacion-recurso-invalida.exception';
import { MetadatosRecursoNoCoincidenException } from '../../../domain/exeption/recurso-contenido/metadatos-recurso-no-coinciden.exception';
import { RecursoMultimediaNoAlmacenadoException } from '../../../domain/exeption/recurso-contenido/recurso-multimedia-no-almacenado.exception';
import { RecursoNoEncontradoException } from '../../../domain/exeption/recurso-contenido/recurso-no-encontrado.exception';
import { TipoRecurso } from '../../../domain/enums/tipo-recurso.enum';
import { ContenidoNoEncontradoException } from '../../../domain/exeption/contenido/contenido-no-encontrado.exception';
import { ContenidoRepository } from '../../../domain/repositories/contenido.repository';
import {
  CambiosRecursoContenido,
  RecursoContenidoRepository,
} from '../../../domain/repositories/recurso-contenido.repository';
import { CoherenciaMimeTypeRecursoVO } from '../../../domain/value-objects/coherencia-mime-type-recurso.vo';
import { ActualizarRecursoContenidoDtoRequest } from '../../dto/recursoContenido/actualizar-recurso-contenido.dto-request';
import { RecursoDetalleDtoResponse } from '../../dto/recursoContenido/recurso-detalle.dto-response';
import { AlmacenamientoRecursosPort } from '../../ports/almacenamiento-recursos.port';

@Injectable()
export class ListarRecursosContenidoUseCase {
  constructor(
    private readonly contenidos: ContenidoRepository,
    private readonly recursos: RecursoContenidoRepository,
  ) {}

  async execute(idContenido: string): Promise<RecursoDetalleDtoResponse[]> {
    if (!(await this.contenidos.buscarPorId(idContenido))) {
      throw new ContenidoNoEncontradoException();
    }
    return (await this.recursos.listarPorContenido(idContenido)).map(
      (detalle) => RecursoDetalleDtoResponse.crear(detalle),
    );
  }
}

@Injectable()
export class ActualizarRecursoContenidoUseCase {
  constructor(
    private readonly recursos: RecursoContenidoRepository,
    private readonly almacenamiento: AlmacenamientoRecursosPort,
  ) {}

  async execute(
    idRecurso: string,
    dto: ActualizarRecursoContenidoDtoRequest,
  ): Promise<RecursoDetalleDtoResponse> {
    if (!Object.values(dto).some((valor) => valor !== undefined)) {
      throw new ActualizacionRecursoInvalidaException(
        'Debe proporcionar al menos un campo para actualizar.',
      );
    }
    const detalle = await this.recursos.buscarDetalle(idRecurso);
    if (!detalle) throw new RecursoNoEncontradoException();
    const { recurso } = detalle;
    await this.recursos.asegurarContenidoEditable(recurso.id_contenido);
    const cambiaArchivo =
      dto.clave_almacenamiento !== undefined ||
      dto.mime_type !== undefined ||
      dto.tamano_bytes !== undefined;
    if (
      cambiaArchivo &&
      (dto.clave_almacenamiento === undefined ||
        dto.mime_type === undefined ||
        dto.tamano_bytes === undefined)
    ) {
      throw new ActualizacionRecursoInvalidaException(
        'La sustitución del archivo requiere clave, MIME y tamaño juntos.',
      );
    }
    if (recurso.tipo_recurso === TipoRecurso.TEXTO) {
      if (
        cambiaArchivo ||
        dto.texto_alternativo !== undefined ||
        dto.duracion_segundos !== undefined
      ) {
        throw new ActualizacionRecursoInvalidaException();
      }
    } else if (dto.texto_contenido !== undefined) {
      throw new ActualizacionRecursoInvalidaException();
    }

    const cambios: CambiosRecursoContenido = {
      textoContenido: dto.texto_contenido,
      textoAlternativo: dto.texto_alternativo,
      duracionSegundos: dto.duracion_segundos,
      idModulos: dto.id_modulos,
    };
    if (cambiaArchivo) {
      const mime = new CoherenciaMimeTypeRecursoVO(
        recurso.tipo_recurso,
        dto.mime_type!,
      ).valor;
      const metadatos = await this.almacenamiento.obtenerMetadatos({
        idContenido: recurso.id_contenido,
        claveAlmacenamiento: dto.clave_almacenamiento!,
      });
      if (!metadatos) throw new RecursoMultimediaNoAlmacenadoException();
      if (
        metadatos.mimeType?.split(';')[0] !== mime ||
        metadatos.tamanoBytes !== dto.tamano_bytes
      ) {
        throw new MetadatosRecursoNoCoincidenException();
      }
      cambios.archivo = {
        claveAlmacenamiento: dto.clave_almacenamiento!,
        mimeType: mime,
        tamanoBytes: dto.tamano_bytes,
      };
    }
    return RecursoDetalleDtoResponse.crear(
      await this.recursos.actualizar(idRecurso, cambios),
    );
  }
}

@Injectable()
export class EliminarRecursoContenidoUseCase {
  constructor(private readonly recursos: RecursoContenidoRepository) {}

  async execute(idRecurso: string): Promise<void> {
    await this.recursos.eliminar(idRecurso);
  }
}
