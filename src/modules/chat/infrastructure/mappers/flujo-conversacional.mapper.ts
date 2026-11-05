import { Prisma } from '@prisma/client';
import type { flujo_conversacion } from '@prisma/client';
import { FlujoConversacional } from '../../domain/entities/flujo/flujo-conversacional.entity';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';

export class FlujoConversacionalMapper {
  static toDomain(fila: flujo_conversacion): FlujoConversacional {
    return new FlujoConversacional(
      fila.id_flujo,
      fila.nombre,
      fila.modalidad as ModalidadConversacional,
      fila.estado as EstadoFlujoConversacional,
      fila.version,
      fila.creado_por,
      fila.fecha_creacion,
      fila.fecha_publicacion,
      fila.tipo_dependencia as TipoDependenciaClinica | null,
      fila.tipo_craving as TipoCravingClinico | null,
      fila.fecha_archivado,
    );
  }

  static toCreateData(
    flujo: FlujoConversacional,
  ): Prisma.flujo_conversacionUncheckedCreateInput {
    return {
      id_flujo: flujo.idFlujo,
      nombre: flujo.nombre,
      modalidad: flujo.modalidad,
      tipo_dependencia: flujo.tipoDependencia,
      tipo_craving: flujo.tipoCraving,
      estado: flujo.estado,
      version: flujo.version,
      creado_por: flujo.creadoPor,
      fecha_creacion: flujo.fechaCreacion,
      fecha_publicacion: flujo.fechaPublicacion,
      fecha_archivado: flujo.fechaArchivado,
    };
  }

  /** Campos que cambian en el ciclo de vida de un flujo ya creado. */
  static toUpdateData(
    flujo: FlujoConversacional,
  ): Prisma.flujo_conversacionUncheckedUpdateInput {
    return {
      nombre: flujo.nombre,
      estado: flujo.estado,
      fecha_publicacion: flujo.fechaPublicacion,
      fecha_archivado: flujo.fechaArchivado,
    };
  }
}
