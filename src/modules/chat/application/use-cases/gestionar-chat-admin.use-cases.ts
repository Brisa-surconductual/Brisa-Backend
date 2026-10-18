import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  OperadorCondicion,
  TipoCravingClinico,
  TipoDatoValidacion,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  NodoConversacionalNoEncontradoException,
  SolicitudActualizacionVaciaException,
  TransicionConversacionalNoEncontradaException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import {
  ActualizarNodoConversacionalDtoRequest,
  ReglaValidacionDtoRequest,
} from '../dto/arbol-conversacional.dto-request';
import {
  FlujoConversacionalDtoResponse,
  NodoConversacionalDtoResponse,
  TipoNodoDtoResponse,
  TransicionConversacionalDtoResponse,
} from '../dto/arbol-conversacional.dto-response';
import {
  ActualizarTransicionReutilizableDtoRequest,
  CrearFlujoConversacionalDtoRequest,
  CrearTransicionReutilizableDtoRequest,
} from '../dto/chat-admin.dto-request';
import {
  CatalogosChatDtoResponse,
  ReglaValidacionDtoResponse,
  TipoEntradaDtoResponse,
} from '../dto/chat-admin.dto-response';
import {
  ActualizarNodoConversacionalUseCase,
  ejecutarSeguro,
} from './gestionar-arbol-conversacional.use-cases';

@Injectable()
export class CrearFlujoConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    dto: CrearFlujoConversacionalDtoRequest,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      if (dto.modalidad === ModalidadConversacional.GRUPAL) {
        if (dto.tipo_dependencia != null || dto.tipo_craving != null) {
          throw new BadRequestException(
            'El perfil clínico solo aplica a la modalidad PERSONALIZADA.',
          );
        }
        return FlujoConversacionalDtoResponse.crear(
          await this.repository.crearFlujoGrupal({
            nombre: dto.nombre.trim(),
            version: 1,
            creadoPor: idActor,
          }),
        );
      }
      return FlujoConversacionalDtoResponse.crear(
        await this.repository.crearFlujoPersonalizado({
          nombre: dto.nombre.trim(),
          tipoDependencia: dto.tipo_dependencia!,
          tipoCraving: dto.tipo_craving!,
          creadoPor: idActor,
        }),
      );
    });
  }
}

@Injectable()
export class ActualizarNodoPorIdUseCase {
  constructor(
    private readonly repository: ArbolConversacionalRepository,
    private readonly actualizarNodo: ActualizarNodoConversacionalUseCase,
  ) {}

  execute(
    idNodo: string,
    dto: ActualizarNodoConversacionalDtoRequest,
    idActor: string,
  ): Promise<NodoConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const nodo = await this.repository.buscarNodo(idNodo);
      if (nodo === null) throw new NodoConversacionalNoEncontradoException();
      return this.actualizarNodo.execute(nodo.idFlujo, idNodo, dto, idActor);
    });
  }
}

@Injectable()
export class CrearTransicionReutilizableUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    dto: CrearTransicionReutilizableDtoRequest,
    idActor: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    return ejecutarSeguro(async () =>
      TransicionConversacionalDtoResponse.crear(
        await this.repository.crearTransicion({
          idFlujo,
          idNodoOrigen: dto.id_nodo_origen,
          idNodoDestino: dto.id_nodo_destino,
          idReglaValidacion: dto.id_regla_validacion,
          operadorCondicion: dto.operador_condicion,
          valorCondicion: dto.valor_condicion,
          ordenEvaluacion: dto.orden_evaluacion,
          creadoPor: idActor,
        }),
      ),
    );
  }
}

@Injectable()
export class ActualizarTransicionPorIdUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idTransicion: string,
    dto: ActualizarTransicionReutilizableDtoRequest,
    idActor: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    if (Object.values(dto).every((valor) => valor === undefined)) {
      throw new SolicitudActualizacionVaciaException();
    }
    return ejecutarSeguro(async () => {
      const transicion = await this.repository.buscarTransicion(idTransicion);
      if (transicion === null) {
        throw new TransicionConversacionalNoEncontradaException();
      }
      return TransicionConversacionalDtoResponse.crear(
        await this.repository.actualizarTransicion({
          idFlujo: transicion.idFlujo,
          idTransicion,
          idNodoDestino: dto.id_nodo_destino,
          idReglaValidacion: dto.id_regla_validacion,
          operadorCondicion: dto.operador_condicion,
          valorCondicion: dto.valor_condicion,
          ordenEvaluacion: dto.orden_evaluacion,
          actualizadoPor: idActor,
        }),
      );
    });
  }
}

@Injectable()
export class CrearReglaValidacionUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    dto: ReglaValidacionDtoRequest,
    idActor: string,
  ): Promise<ReglaValidacionDtoResponse> {
    return ejecutarSeguro(async () =>
      ReglaValidacionDtoResponse.crear(
        await this.repository.crearReglaValidacion({
          tipoDato: dto.tipo_dato,
          obligatorio: dto.obligatorio ?? true,
          valorMin: dto.valor_min ?? null,
          valorMax: dto.valor_max ?? null,
          formatoRegex: dto.formato_regex ?? null,
          valoresPermitidos: dto.valores_permitidos ?? [],
          mensajeError: dto.mensaje_error.trim(),
          creadoPor: idActor,
        }),
      ),
    );
  }
}

@Injectable()
export class ConsultarCatalogosChatUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(): Promise<CatalogosChatDtoResponse> {
    return ejecutarSeguro(async () => {
      const [tiposNodo, tiposEntrada, reglas] = await Promise.all([
        this.repository.listarTiposNodo(),
        this.repository.listarTiposEntrada(),
        this.repository.listarReglasValidacion(),
      ]);
      return {
        tipos_nodo: tiposNodo.map((tipo) => TipoNodoDtoResponse.crear(tipo)),
        tipos_entrada: tiposEntrada.map((tipo) =>
          TipoEntradaDtoResponse.crear(tipo),
        ),
        reglas_validacion: reglas.map((regla) =>
          ReglaValidacionDtoResponse.crear(regla),
        ),
        enums: {
          modalidad: Object.values(ModalidadConversacional),
          tipo_dependencia: Object.values(TipoDependenciaClinica),
          tipo_craving: Object.values(TipoCravingClinico),
          operador_condicion: Object.values(OperadorCondicion),
          tipo_dato: Object.values(TipoDatoValidacion),
          estado_flujo: Object.values(EstadoFlujoConversacional),
        },
      };
    });
  }
}
