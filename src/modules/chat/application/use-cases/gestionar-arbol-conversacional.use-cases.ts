import { HttpException, Injectable } from '@nestjs/common';
import { ReglaValidacion } from '../../domain/entities/arbol-conversacional.entity';
import {
  FlujoConversacionalNoEncontradoException,
  PersistenciaArbolConversacionalException,
  SolicitudActualizacionVaciaException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import {
  ActualizarNodoConversacionalDtoRequest,
  ActualizarTransicionConversacionalDtoRequest,
  CrearFlujoGrupalDtoRequest,
  CrearNodoConversacionalDtoRequest,
  CrearTransicionConversacionalDtoRequest,
} from '../dto/arbol-conversacional.dto-request';
import {
  ArbolConversacionalDtoResponse,
  FlujoConversacionalDtoResponse,
  NodoConversacionalDtoResponse,
  TipoNodoDtoResponse,
  TransicionConversacionalDtoResponse,
  ValidacionArbolDtoResponse,
} from '../dto/arbol-conversacional.dto-response';

export async function ejecutarSeguro<T>(
  operacion: () => Promise<T>,
): Promise<T> {
  try {
    return await operacion();
  } catch (error: unknown) {
    if (error instanceof HttpException) throw error;
    throw new PersistenciaArbolConversacionalException();
  }
}

@Injectable()
export class CrearFlujoGrupalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    dto: CrearFlujoGrupalDtoRequest,
    idAdministrador: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () =>
      FlujoConversacionalDtoResponse.crear(
        await this.repository.crearFlujoGrupal({
          nombre: dto.nombre.trim(),
          version: dto.version,
          creadoPor: idAdministrador,
        }),
      ),
    );
  }
}

@Injectable()
export class ListarTiposNodoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(): Promise<TipoNodoDtoResponse[]> {
    return ejecutarSeguro(async () =>
      (await this.repository.listarTiposNodo()).map((tipo) =>
        TipoNodoDtoResponse.crear(tipo),
      ),
    );
  }
}

@Injectable()
export class ConsultarArbolConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(idFlujo: string): Promise<ArbolConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();
      return ArbolConversacionalDtoResponse.crear(arbol);
    });
  }
}

@Injectable()
export class CrearNodoConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    dto: CrearNodoConversacionalDtoRequest,
    idAdministrador: string,
  ): Promise<NodoConversacionalDtoResponse> {
    return ejecutarSeguro(async () =>
      NodoConversacionalDtoResponse.crear(
        await this.repository.crearNodo({
          idFlujo,
          idTipoNodo: dto.id_tipo_nodo,
          contenido: dto.contenido,
          esNodoInicial: dto.es_nodo_inicial,
          orden: dto.orden ?? null,
          idContenidoCronograma: dto.id_contenido_cronograma ?? null,
          creadoPor: idAdministrador,
        }),
      ),
    );
  }
}

@Injectable()
export class ActualizarNodoConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idNodo: string,
    dto: ActualizarNodoConversacionalDtoRequest,
    idAdministrador: string,
  ): Promise<NodoConversacionalDtoResponse> {
    if (Object.values(dto).every((valor) => valor === undefined)) {
      throw new SolicitudActualizacionVaciaException();
    }

    return ejecutarSeguro(async () =>
      NodoConversacionalDtoResponse.crear(
        await this.repository.actualizarNodo({
          idFlujo,
          idNodo,
          idTipoNodo: dto.id_tipo_nodo,
          contenido: dto.contenido,
          esNodoInicial: dto.es_nodo_inicial,
          orden: dto.orden,
          idContenidoCronograma: dto.id_contenido_cronograma,
          actualizadoPor: idAdministrador,
        }),
      ),
    );
  }
}

@Injectable()
export class CrearTransicionConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    dto: CrearTransicionConversacionalDtoRequest,
    idAdministrador: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    const regla = dto.regla_validacion;
    new ReglaValidacion(
      'validacion-previa',
      regla.tipo_dato,
      regla.obligatorio,
      regla.valor_min ?? null,
      regla.valor_max ?? null,
      regla.formato_regex ?? null,
      regla.valores_permitidos,
      regla.mensaje_error,
    );

    return ejecutarSeguro(async () =>
      TransicionConversacionalDtoResponse.crear(
        await this.repository.crearTransicion({
          idFlujo,
          idNodoOrigen: dto.id_nodo_origen,
          idNodoDestino: dto.id_nodo_destino,
          operadorCondicion: dto.operador_condicion,
          valorCondicion: dto.valor_condicion,
          ordenEvaluacion: dto.orden_evaluacion,
          reglaValidacion: {
            tipoDato: regla.tipo_dato,
            obligatorio: regla.obligatorio,
            valorMin: regla.valor_min ?? null,
            valorMax: regla.valor_max ?? null,
            formatoRegex: regla.formato_regex ?? null,
            valoresPermitidos: regla.valores_permitidos,
            mensajeError: regla.mensaje_error,
          },
          creadoPor: idAdministrador,
        }),
      ),
    );
  }
}

@Injectable()
export class ActualizarTransicionConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idTransicion: string,
    dto: ActualizarTransicionConversacionalDtoRequest,
    idAdministrador: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    if (Object.values(dto).every((valor) => valor === undefined)) {
      throw new SolicitudActualizacionVaciaException();
    }

    const regla = dto.regla_validacion;
    return ejecutarSeguro(async () =>
      TransicionConversacionalDtoResponse.crear(
        await this.repository.actualizarTransicion({
          idFlujo,
          idTransicion,
          idNodoOrigen: dto.id_nodo_origen,
          idNodoDestino: dto.id_nodo_destino,
          operadorCondicion: dto.operador_condicion,
          valorCondicion: dto.valor_condicion,
          ordenEvaluacion: dto.orden_evaluacion,
          reglaValidacion:
            regla === undefined
              ? undefined
              : {
                  tipoDato: regla.tipo_dato,
                  obligatorio: regla.obligatorio,
                  valorMin: regla.valor_min,
                  valorMax: regla.valor_max,
                  formatoRegex: regla.formato_regex,
                  valoresPermitidos: regla.valores_permitidos,
                  mensajeError: regla.mensaje_error,
                },
          actualizadoPor: idAdministrador,
        }),
      ),
    );
  }
}

@Injectable()
export class ValidarArbolConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(idFlujo: string): Promise<ValidacionArbolDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();
      return ValidacionArbolDtoResponse.crear(arbol.validarEstructura());
    });
  }
}

@Injectable()
export class PublicarArbolConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idAdministrador: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () =>
      FlujoConversacionalDtoResponse.crear(
        await this.repository.publicar(idFlujo, idAdministrador),
      ),
    );
  }
}
