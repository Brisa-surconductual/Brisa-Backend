import { BadRequestException, Injectable } from '@nestjs/common';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from '../dto/arbol-conversacional.dto-response';
import { ListarFlujosDtoRequest } from '../dto/gestion-flujos.dto-request';
import {
  FlujoArchivadoDtoResponse,
  FlujoPublicadoDtoResponse,
  ListadoFlujosDtoResponse,
  VersionClonadaDtoResponse,
} from '../dto/gestion-flujos.dto-response';
import { ejecutarSeguro } from './gestionar-arbol-conversacional.use-cases';

@Injectable()
export class ListarFlujosUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(dto: ListarFlujosDtoRequest): Promise<ListadoFlujosDtoResponse> {
    if (!Number.isSafeInteger((dto.page - 1) * dto.page_size)) {
      throw new BadRequestException(
        'La paginación excede el rango de enteros admitido.',
      );
    }
    return ejecutarSeguro(async () => {
      const resultado = await this.repository.listarFlujos({
        modalidad: dto.modalidad,
        tipoDependencia: dto.tipo_dependencia,
        tipoCraving: dto.tipo_craving,
        estado: dto.estado,
        page: dto.page,
        pageSize: dto.page_size,
      });
      return {
        data: {
          items: resultado.items.map((flujo) =>
            FlujoConversacionalDtoResponse.crear(flujo),
          ),
        },
        meta: {
          page: dto.page,
          page_size: dto.page_size,
          total: resultado.total,
        },
      };
    });
  }
}

@Injectable()
export class ClonarVersionFlujoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<VersionClonadaDtoResponse> {
    return ejecutarSeguro(async () =>
      VersionClonadaDtoResponse.crear(
        await this.repository.clonarVersion(idFlujo, idActor),
      ),
    );
  }
}

@Injectable()
export class PublicarFlujoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoPublicadoDtoResponse> {
    return ejecutarSeguro(async () => {
      const flujo = await this.repository.publicarAdministrativo(
        idFlujo,
        idActor,
      );
      return {
        id_flujo: flujo.idFlujo,
        estado: flujo.estado,
        version: flujo.version,
        fecha_publicacion: flujo.fechaPublicacion,
      };
    });
  }
}

@Injectable()
export class ArchivarFlujoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoArchivadoDtoResponse> {
    return ejecutarSeguro(async () => {
      const flujo = await this.repository.archivarAdministrativo(
        idFlujo,
        idActor,
      );
      return {
        id_flujo: flujo.idFlujo,
        estado: flujo.estado,
        fecha_archivado: flujo.fechaArchivado,
      };
    });
  }
}
