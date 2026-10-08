import { Injectable } from '@nestjs/common';
import {
  EliminacionArbolPersonalizadoProhibidaException,
  FlujoPersonalizadoNoEncontradoException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import {
  ModalidadConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
  EstadoFlujoConversacional,
} from '../../domain/enums/arbol-conversacional.enums';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import {
  ArbolConversacionalDtoResponse,
  FlujoConversacionalDtoResponse,
} from '../dto/arbol-conversacional.dto-response';
import {
  CrearArbolPersonalizadoDtoRequest,
  ConsultarPerfilArbolDtoRequest,
} from '../dto/arbol-personalizado.dto-request';
import {
  AuditoriaArbolDtoResponse,
  HistorialArbolesPersonalizadosDtoResponse,
} from '../dto/arbol-personalizado.dto-response';
import { ejecutarSeguro } from './gestionar-arbol-conversacional.use-cases';

@Injectable()
export class CrearArbolPersonalizadoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    dto: CrearArbolPersonalizadoDtoRequest,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () =>
      FlujoConversacionalDtoResponse.crear(
        await this.repository.crearFlujoPersonalizado({
          nombre: dto.nombre.trim(),
          tipoDependencia: dto.tipo_dependencia,
          tipoCraving: dto.tipo_craving,
          creadoPor: idActor,
        }),
      ),
    );
  }
}

@Injectable()
export class ClonarVersionPersonalizadaUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () =>
      FlujoConversacionalDtoResponse.crear(
        await this.repository.clonarVersionPersonalizada(idFlujo, idActor),
      ),
    );
  }
}

@Injectable()
export class ListarArbolesPersonalizadosUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(): Promise<HistorialArbolesPersonalizadosDtoResponse> {
    return ejecutarSeguro(async () => {
      const flujos = await this.repository.listarFlujosPersonalizados();
      const combinaciones = Object.values(TipoDependenciaClinica).flatMap(
        (tipoDependencia) =>
          Object.values(TipoCravingClinico).map((tipoCraving) => {
            const versiones = flujos
              .filter(
                (flujo) =>
                  flujo.tipoDependencia === tipoDependencia &&
                  flujo.tipoCraving === tipoCraving,
              )
              .map((flujo) => FlujoConversacionalDtoResponse.crear(flujo));
            return {
              tipo_dependencia: tipoDependencia,
              tipo_craving: tipoCraving,
              publicado:
                versiones.find(
                  (flujo) =>
                    flujo.estado === EstadoFlujoConversacional.PUBLICADO,
                ) ?? null,
              versiones,
            };
          }),
      );
      return { combinaciones };
    });
  }
}

@Injectable()
export class ConsultarArbolPersonalizadoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(idFlujo: string): Promise<ArbolConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (
        arbol === null ||
        arbol.flujo.modalidad !== ModalidadConversacional.PERSONALIZADA
      ) {
        throw new FlujoPersonalizadoNoEncontradoException();
      }
      return ArbolConversacionalDtoResponse.crear(arbol);
    });
  }
}

@Injectable()
export class ConsultarPublicadoPersonalizadoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    perfil: ConsultarPerfilArbolDtoRequest,
  ): Promise<FlujoConversacionalDtoResponse | null> {
    return ejecutarSeguro(async () => {
      const flujo = await this.repository.buscarPublicadoPersonalizado({
        tipoDependencia: perfil.tipo_dependencia,
        tipoCraving: perfil.tipo_craving,
      });
      return flujo === null
        ? null
        : FlujoConversacionalDtoResponse.crear(flujo);
    });
  }
}

@Injectable()
export class PublicarArbolPersonalizadoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () =>
      FlujoConversacionalDtoResponse.crear(
        await this.repository.publicarPersonalizado(idFlujo, idActor),
      ),
    );
  }
}

@Injectable()
export class ArchivarArbolPersonalizadoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () =>
      FlujoConversacionalDtoResponse.crear(
        await this.repository.archivarPersonalizado(idFlujo, idActor),
      ),
    );
  }
}

@Injectable()
export class ConsultarAuditoriaArbolUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(idFlujo: string): Promise<AuditoriaArbolDtoResponse[]> {
    return ejecutarSeguro(async () =>
      (await this.repository.listarAuditoriaArbol(idFlujo)).map((registro) =>
        AuditoriaArbolDtoResponse.crear(registro),
      ),
    );
  }
}

@Injectable()
export class RechazarEliminacionArbolPersonalizadoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(idFlujo: string): Promise<never> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (
        arbol === null ||
        arbol.flujo.modalidad !== ModalidadConversacional.PERSONALIZADA
      ) {
        throw new FlujoPersonalizadoNoEncontradoException();
      }
      throw new EliminacionArbolPersonalizadoProhibidaException();
    });
  }
}
