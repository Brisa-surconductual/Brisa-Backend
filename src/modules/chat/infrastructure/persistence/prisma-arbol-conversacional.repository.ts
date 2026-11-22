import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { AuditoriaArbolConversacional } from '../../domain/entities/catalogos/auditoria-arbol-conversacional.entity';
import { ContenidoConProgramaciones } from '../../domain/entities/catalogos/contenido-con-programaciones.entity';
import { ContenidoCronogramaConversacional } from '../../domain/entities/catalogos/contenido-cronograma.entity';
import { TipoEntradaConversacional } from '../../domain/entities/catalogos/tipo-entrada.entity';
import { TipoNodoConversacional } from '../../domain/entities/catalogos/tipo-nodo.entity';
import { ArbolConversacional } from '../../domain/entities/flujo/arbol-conversacional.entity';
import { FlujoConversacional } from '../../domain/entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../../domain/entities/flujo/transicion-conversacional.entity';
import { ReglaValidacion } from '../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { AccionAuditoriaArbol } from '../../domain/enums/accion-auditoria-arbol.enum';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import {
  ContenidoCronogramaNoEncontradoException,
  DomainException,
  FlujoConversacionalNoEncontradoException,
  FlujoGrupalPublicadoExistenteException,
  FlujoPersonalizadoPublicadoExistenteException,
  NodoConversacionalDuplicadoException,
  NodoConversacionalNoEncontradoException,
  NodoDestinoNoEncontradoException,
  NodoFinalDuplicadoException,
  NodoInicialDuplicadoException,
  NodoOrigenNoEncontradoException,
  OrdenTransicionDuplicadoException,
  ReglaValidacionInvalidaException,
  ReglaValidacionNoEncontradaException,
  TipoNodoNoEncontradoException,
  TransicionConversacionalNoEncontradaException,
  VersionPersonalizadaDuplicadaException,
} from '../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import { CatalogosConversacionalesMapper } from '../mappers/catalogos-conversacionales.mapper';
import { FlujoConversacionalMapper } from '../mappers/flujo-conversacional.mapper';
import { NodoConversacionalMapper } from '../mappers/nodo-conversacional.mapper';
import { ReglaValidacionMapper } from '../mappers/regla-validacion.mapper';
import { extrasNodos, guardarExtrasNodo } from './consultas-nodo-extra';
import {
  INCLUIR_REGLA_DE_TRANSICION,
  TransicionConversacionalMapper,
} from '../mappers/transicion-conversacional.mapper';

@Injectable()
export class PrismaArbolConversacionalRepository implements ArbolConversacionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Consultas ────────────────────────────────────────────────────────────

  async obtenerFlujo(idFlujo: string): Promise<FlujoConversacional | null> {
    const flujo = await this.prisma.flujo_conversacion.findUnique({
      where: { id_flujo: idFlujo },
    });
    return flujo === null ? null : FlujoConversacionalMapper.toDomain(flujo);
  }

  obtenerArbol(idFlujo: string): Promise<ArbolConversacional | null> {
    return this.cargarArbol(this.prisma, idFlujo);
  }

  async buscarNodo(idNodo: string): Promise<NodoConversacional | null> {
    const nodo = await this.prisma.nodos.findUnique({
      where: { id_nodo: idNodo },
      include: { tipo_nodo: { select: { nombre: true } } },
    });
    if (nodo === null) return null;
    const extras = await extrasNodos(this.prisma, [nodo.id_nodo]);
    return NodoConversacionalMapper.toDomain(nodo, extras.get(nodo.id_nodo));
  }

  async buscarNodosPorIds(ids: string[]): Promise<NodoConversacional[]> {
    const nodos = await this.prisma.nodos.findMany({
      where: { id_nodo: { in: ids } },
      include: { tipo_nodo: { select: { nombre: true } } },
    });
    const extras = await extrasNodos(
      this.prisma,
      nodos.map((nodo) => nodo.id_nodo),
    );
    return nodos.map((nodo) =>
      NodoConversacionalMapper.toDomain(nodo, extras.get(nodo.id_nodo)),
    );
  }

  async buscarTransicion(
    idTransicion: string,
  ): Promise<TransicionConversacional | null> {
    const transicion = await this.prisma.reglas_nodos.findUnique({
      where: { id_regla: idTransicion },
      include: INCLUIR_REGLA_DE_TRANSICION,
    });
    return transicion === null
      ? null
      : TransicionConversacionalMapper.toDomain(transicion);
  }

  async buscarTipoNodo(
    idTipoNodo: string,
  ): Promise<TipoNodoConversacional | null> {
    const tipo = await this.prisma.tipo_nodo.findUnique({
      where: { id_tipo_nodo: idTipoNodo },
    });
    return tipo === null
      ? null
      : CatalogosConversacionalesMapper.tipoNodoToDomain(tipo);
  }

  async listarFlujos(
    filtro: Partial<
      Pick<
        FlujoConversacional,
        'modalidad' | 'tipoDependencia' | 'tipoCraving' | 'estado'
      >
    >,
    page: number,
    pageSize: number,
  ): Promise<{ items: FlujoConversacional[]; total: number }> {
    const where: Prisma.flujo_conversacionWhereInput = {
      modalidad: filtro.modalidad,
      tipo_dependencia: filtro.tipoDependencia,
      tipo_craving: filtro.tipoCraving,
      estado: filtro.estado,
    };
    return this.ejecutarTransaccion(async (tx) => {
      const [items, total] = await Promise.all([
        tx.flujo_conversacion.findMany({
          where,
          orderBy: [{ fecha_creacion: 'desc' }, { id_flujo: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        tx.flujo_conversacion.count({ where }),
      ]);
      return {
        items: items.map((flujo) => FlujoConversacionalMapper.toDomain(flujo)),
        total,
      };
    });
  }

  async listarFlujosPersonalizados(): Promise<FlujoConversacional[]> {
    const flujos = await this.prisma.flujo_conversacion.findMany({
      where: { modalidad: ModalidadConversacional.PERSONALIZADA },
      orderBy: [
        { tipo_dependencia: 'asc' },
        { tipo_craving: 'asc' },
        { version: 'desc' },
      ],
    });
    return flujos.map((flujo) => FlujoConversacionalMapper.toDomain(flujo));
  }

  async buscarPublicadoGrupal(): Promise<FlujoConversacional | null> {
    const flujo = await this.prisma.flujo_conversacion.findFirst({
      where: {
        modalidad: ModalidadConversacional.GRUPAL,
        estado: EstadoFlujoConversacional.PUBLICADO,
      },
    });
    return flujo === null ? null : FlujoConversacionalMapper.toDomain(flujo);
  }

  async buscarPublicadoPersonalizado(
    tipoDependencia: TipoDependenciaClinica,
    tipoCraving: TipoCravingClinico,
  ): Promise<FlujoConversacional | null> {
    const flujo = await this.prisma.flujo_conversacion.findFirst({
      where: {
        modalidad: ModalidadConversacional.PERSONALIZADA,
        tipo_dependencia: tipoDependencia,
        tipo_craving: tipoCraving,
        estado: EstadoFlujoConversacional.PUBLICADO,
      },
    });
    return flujo === null ? null : FlujoConversacionalMapper.toDomain(flujo);
  }

  async obtenerUltimaVersionPersonalizada(
    tipoDependencia: TipoDependenciaClinica,
    tipoCraving: TipoCravingClinico,
  ): Promise<number> {
    const ultima = await this.prisma.flujo_conversacion.findFirst({
      where: {
        modalidad: ModalidadConversacional.PERSONALIZADA,
        tipo_dependencia: tipoDependencia,
        tipo_craving: tipoCraving,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return ultima?.version ?? 0;
  }

  async listarAuditoriaArbol(
    idFlujo: string,
  ): Promise<AuditoriaArbolConversacional[]> {
    const registros = await this.prisma.auditoria_arboles.findMany({
      where: { id_flujo: idFlujo },
      orderBy: { id_auditoria: 'asc' },
    });
    return registros.map((registro) =>
      CatalogosConversacionalesMapper.auditoriaToDomain(registro, idFlujo),
    );
  }

  async listarTiposNodo(): Promise<TipoNodoConversacional[]> {
    const tipos = await this.prisma.tipo_nodo.findMany({
      orderBy: { nombre: 'asc' },
    });
    return tipos.map((tipo) =>
      CatalogosConversacionalesMapper.tipoNodoToDomain(tipo),
    );
  }

  async listarTiposEntrada(): Promise<TipoEntradaConversacional[]> {
    const tipos = await this.prisma.tipo_entrada.findMany({
      orderBy: { nombre: 'asc' },
    });
    return tipos.map((tipo) =>
      CatalogosConversacionalesMapper.tipoEntradaToDomain(tipo),
    );
  }

  async listarContenidosCronograma(): Promise<
    ContenidoCronogramaConversacional[]
  > {
    const filas = await this.prisma.contenidos_cronograma.findMany({
      include: {
        contenidos: { select: { nombre_contenido: true } },
        unidades_temporales: {
          select: { nombre_unidad: true, orden_unidad: true },
        },
      },
      orderBy: [
        { unidades_temporales: { orden_unidad: 'asc' } },
        { orden_contenido: 'asc' },
      ],
    });
    return filas.map((fila) =>
      CatalogosConversacionalesMapper.contenidoCronogramaToDomain(fila),
    );
  }

  async existeContenido(idContenido: string): Promise<boolean> {
    const fila = await this.prisma.contenidos.findUnique({
      where: { id_contenido: idContenido },
      select: { id_contenido: true },
    });
    return fila !== null;
  }

  /**
   * RF-25 / RF-24: contenidos con todas sus programaciones (cronograma, unidad
   * y fechas). Se consulta desde las programaciones (relación ya en lista)
   * y se completa con los contenidos aún no programados.
   */
  async listarContenidosConProgramaciones(): Promise<
    ContenidoConProgramaciones[]
  > {
    const [contenidos, programaciones] = await Promise.all([
      this.prisma.contenidos.findMany({
        select: {
          id_contenido: true,
          nombre_contenido: true,
          tipo_contenido: true,
        },
        orderBy: [{ nombre_contenido: 'asc' }, { id_contenido: 'asc' }],
      }),
      this.prisma.contenidos_cronograma.findMany({
        include: { unidades_temporales: { include: { cronogramas: true } } },
      }),
    ]);
    return CatalogosConversacionalesMapper.contenidosConProgramacionesToDomain(
      contenidos,
      programaciones,
    );
  }

  // ── Persistencia ─────────────────────────────────────────────────────────

  async guardarFlujo(
    flujo: FlujoConversacional,
    idActor: string,
  ): Promise<void> {
    await this.guardarFlujos([flujo], idActor);
  }

  async guardarFlujos(
    flujos: FlujoConversacional[],
    idActor: string,
  ): Promise<void> {
    try {
      await this.ejecutarTransaccion(async (tx) => {
        for (const flujo of flujos) {
          await this.persistirFlujo(tx, flujo, idActor);
        }
      });
    } catch (error: unknown) {
      this.traducirErrorFlujo(error);
    }
  }

  async guardarArbolClonado(
    arbol: ArbolConversacional,
    idFlujoOrigen: string,
    idActor: string,
  ): Promise<void> {
    try {
      await this.ejecutarTransaccion(async (tx) => {
        await tx.flujo_conversacion.create({
          data: FlujoConversacionalMapper.toCreateData(arbol.flujo),
        });
        for (const nodo of arbol.nodos) {
          await tx.nodos.create({
            data: NodoConversacionalMapper.toCreateData(nodo),
          });
          await guardarExtrasNodo(tx, nodo);
        }
        for (const transicion of arbol.transiciones) {
          await this.persistirRegla(tx, transicion.reglaValidacion);
          await tx.reglas_nodos.create({
            data: TransicionConversacionalMapper.toCreateData(transicion),
          });
        }
        await this.auditar(
          tx,
          arbol.flujo.idFlujo,
          idActor,
          AccionAuditoriaArbol.CLONAR_VERSION,
          idFlujoOrigen,
        );
      });
    } catch (error: unknown) {
      this.traducirErrorFlujo(error);
    }
  }

  async guardarNodo(
    nodo: NodoConversacional,
    idActor: string,
    transicionesAEliminar: TransicionConversacional[] = [],
  ): Promise<void> {
    try {
      await this.ejecutarTransaccion(async (tx) => {
        for (const transicion of transicionesAEliminar) {
          await this.eliminarTransicion(tx, transicion, idActor);
        }
        const existente = await tx.nodos.findUnique({
          where: { id_nodo: nodo.idNodo },
          select: { id_nodo: true },
        });
        // `es_nodo_final` va fuera del cliente tipado hasta regenerar
        // schema.prisma (RF-25). Se quita antes y se pone después del UPDATE
        // tipado para no violar `ck_nodos_inicial_no_final` en un intercambio.
        if (existente !== null && !nodo.esNodoFinal)
          await guardarExtrasNodo(tx, nodo);
        if (existente === null) {
          await tx.nodos.create({
            data: NodoConversacionalMapper.toCreateData(nodo),
          });
        } else {
          await tx.nodos.update({
            where: { id_nodo: nodo.idNodo },
            data: NodoConversacionalMapper.toUpdateData(nodo),
          });
        }
        if (existente === null || nodo.esNodoFinal)
          await guardarExtrasNodo(tx, nodo);
        await this.auditar(
          tx,
          nodo.idFlujo,
          idActor,
          existente === null
            ? AccionAuditoriaArbol.CREAR_NODO
            : AccionAuditoriaArbol.EDITAR_NODO,
          nodo.idNodo,
        );
      });
    } catch (error: unknown) {
      this.traducirErrorNodo(error);
    }
  }

  guardarTransicion(
    transicion: TransicionConversacional,
    idActor: string,
  ): Promise<void> {
    return this.guardarTransiciones([transicion], idActor);
  }

  async guardarTransiciones(
    transiciones: TransicionConversacional[],
    idActor: string,
  ): Promise<void> {
    try {
      // `uq_reglas_nodos_origen_orden` es DEFERRABLE: el reordenamiento se
      // valida al confirmar la transacción, no en cada actualización.
      await this.ejecutarTransaccion(async (tx) => {
        for (const transicion of transiciones) {
          await this.persistirTransicion(tx, transicion, idActor);
        }
      });
    } catch (error: unknown) {
      this.traducirErrorTransicion(error);
    }
  }

  // ── Soporte ──────────────────────────────────────────────────────────────

  private async persistirTransicion(
    tx: Prisma.TransactionClient,
    transicion: TransicionConversacional,
    idActor: string,
  ): Promise<void> {
    await this.persistirRegla(tx, transicion.reglaValidacion);
    const existente = await tx.reglas_nodos.findUnique({
      where: { id_regla: transicion.idTransicion },
      select: { id_regla: true, id_regla_validacion: true },
    });
    if (existente === null) {
      await tx.reglas_nodos.create({
        data: TransicionConversacionalMapper.toCreateData(transicion),
      });
    } else {
      await tx.reglas_nodos.update({
        where: { id_regla: transicion.idTransicion },
        data: TransicionConversacionalMapper.toUpdateData(transicion),
      });
      // La regla es propia de la transición: si se reemplazó, la anterior sobra.
      const anterior = existente.id_regla_validacion;
      if (
        anterior !== null &&
        anterior !== transicion.reglaValidacion?.idReglaValidacion
      ) {
        await tx.reglas_validaciones.delete({
          where: { id_regla_validacion: anterior },
        });
      }
    }
    await this.auditar(
      tx,
      transicion.idFlujo,
      idActor,
      existente === null
        ? AccionAuditoriaArbol.CREAR_TRANSICION
        : AccionAuditoriaArbol.EDITAR_TRANSICION,
      transicion.idTransicion,
    );
  }

  /** Elimina la transición y luego su regla propia (la FK apunta a la regla). */
  private async eliminarTransicion(
    tx: Prisma.TransactionClient,
    transicion: TransicionConversacional,
    idActor: string,
  ): Promise<void> {
    await tx.reglas_nodos.delete({
      where: { id_regla: transicion.idTransicion },
    });
    if (transicion.reglaValidacion !== null) {
      await tx.reglas_validaciones.delete({
        where: {
          id_regla_validacion: transicion.reglaValidacion.idReglaValidacion,
        },
      });
    }
    await this.auditar(
      tx,
      transicion.idFlujo,
      idActor,
      AccionAuditoriaArbol.ELIMINAR_TRANSICION,
      transicion.idTransicion,
    );
  }

  private async persistirFlujo(
    tx: Prisma.TransactionClient,
    flujo: FlujoConversacional,
    idActor: string,
  ): Promise<void> {
    const existente = await tx.flujo_conversacion.findUnique({
      where: { id_flujo: flujo.idFlujo },
      select: { id_flujo: true },
    });
    if (existente === null) {
      await tx.flujo_conversacion.create({
        data: FlujoConversacionalMapper.toCreateData(flujo),
      });
      await this.auditar(
        tx,
        flujo.idFlujo,
        idActor,
        AccionAuditoriaArbol.CREAR_FLUJO,
      );
      return;
    }
    await tx.flujo_conversacion.update({
      where: { id_flujo: flujo.idFlujo },
      data: FlujoConversacionalMapper.toUpdateData(flujo),
    });
    await this.auditar(
      tx,
      flujo.idFlujo,
      idActor,
      flujo.estado === EstadoFlujoConversacional.ARCHIVADO
        ? AccionAuditoriaArbol.ARCHIVAR
        : AccionAuditoriaArbol.PUBLICAR,
    );
  }

  /** Crea la regla si no existe; si existe, actualiza su definición. */
  private async persistirRegla(
    tx: Prisma.TransactionClient,
    regla: ReglaValidacion | null,
  ): Promise<void> {
    if (regla === null) return;
    await tx.reglas_validaciones.upsert({
      where: { id_regla_validacion: regla.idReglaValidacion },
      create: ReglaValidacionMapper.toData(regla),
      update: ReglaValidacionMapper.toData(regla),
    });
  }

  private async cargarArbol(
    cliente: Prisma.TransactionClient,
    idFlujo: string,
  ): Promise<ArbolConversacional | null> {
    const flujo = await cliente.flujo_conversacion.findUnique({
      where: { id_flujo: idFlujo },
    });
    if (flujo === null) return null;

    const [nodos, transiciones] = await Promise.all([
      cliente.nodos.findMany({
        where: { id_flujo: idFlujo },
        include: { tipo_nodo: { select: { nombre: true } } },
        orderBy: [{ orden: 'asc' }, { fecha_creacion: 'asc' }],
      }),
      cliente.reglas_nodos.findMany({
        where: { id_flujo: idFlujo },
        include: INCLUIR_REGLA_DE_TRANSICION,
        orderBy: [{ id_nodo_origen: 'asc' }, { orden_evaluacion: 'asc' }],
      }),
    ]);

    const extras = await extrasNodos(
      cliente,
      nodos.map((nodo) => nodo.id_nodo),
    );
    return new ArbolConversacional(
      FlujoConversacionalMapper.toDomain(flujo),
      nodos.map((nodo) =>
        NodoConversacionalMapper.toDomain(nodo, extras.get(nodo.id_nodo)),
      ),
      transiciones.map((transicion) =>
        TransicionConversacionalMapper.toDomain(transicion),
      ),
    );
  }

  private async auditar(
    tx: Prisma.TransactionClient,
    idFlujo: string | null,
    idActor: string,
    accion: AccionAuditoriaArbol,
    idObjeto: string | null = null,
  ): Promise<void> {
    await tx.auditoria_arboles.create({
      data: {
        id_flujo: idFlujo!,
        id_actor: idActor,
        accion,
        id_objeto: idObjeto,
      },
    });
  }

  // ── Traducción de errores de base de datos ───────────────────────────────

  private traducirErrorFlujo(error: unknown): never {
    if (error instanceof HttpException || error instanceof DomainException)
      throw error;
    if (this.esErrorPrisma(error, 'P2002')) {
      const detalle = this.obtenerDetalle(error);
      if (detalle.includes('uq_flujo_version_personalizada')) {
        throw new VersionPersonalizadaDuplicadaException();
      }
      if (
        detalle.includes('uq_flujo_publicado_grupal') ||
        (detalle.includes('modalidad') && !detalle.includes('tipo_dependencia'))
      ) {
        throw new FlujoGrupalPublicadoExistenteException();
      }
      throw new FlujoPersonalizadoPublicadoExistenteException();
    }
    throw error;
  }

  private traducirErrorNodo(error: unknown): never {
    if (error instanceof HttpException || error instanceof DomainException)
      throw error;
    if (this.esErrorPrisma(error, 'P2025')) {
      throw new NodoConversacionalNoEncontradoException();
    }
    const detalle = this.obtenerDetalle(error);
    if (this.esErrorPrisma(error, 'P2002')) {
      if (detalle.includes('uq_nodo_inicial_por_flujo')) {
        throw new NodoInicialDuplicadoException();
      }
      throw new NodoConversacionalDuplicadoException();
    }
    // La marca de nodo final se escribe con SQL crudo: su violación llega como
    // error de consulta (P2010 / 23505), no como P2002.
    if (detalle.includes('uq_nodo_final_por_flujo')) {
      throw new NodoFinalDuplicadoException();
    }
    if (this.esErrorPrisma(error, 'P2003')) {
      if (
        detalle.includes('fk_nodo_tipo') ||
        detalle.includes('id_tipo_nodo')
      ) {
        throw new TipoNodoNoEncontradoException();
      }
      if (
        detalle.includes('fk_nodo_contenido') ||
        detalle.includes('id_contenido')
      ) {
        throw new ContenidoCronogramaNoEncontradoException();
      }
      throw new FlujoConversacionalNoEncontradoException();
    }
    throw error;
  }

  private traducirErrorTransicion(error: unknown): never {
    if (error instanceof HttpException || error instanceof DomainException)
      throw error;
    if (this.esErrorPrisma(error, 'P2025')) {
      throw new TransicionConversacionalNoEncontradaException();
    }
    const detalle = this.obtenerDetalle(error);
    if (this.esErrorPrisma(error, 'P2002')) {
      if (detalle.includes('uq_reglas_nodos_regla_validacion')) {
        throw new ReglaValidacionInvalidaException(
          'La regla de validación ya pertenece a otra transición.',
        );
      }
      throw new OrdenTransicionDuplicadoException();
    }
    if (this.esErrorPrisma(error, 'P2003')) {
      if (
        detalle.includes('fk_regla_validacion') ||
        detalle.includes('id_regla_validacion')
      ) {
        throw new ReglaValidacionNoEncontradaException();
      }
      if (detalle.includes('destino'))
        throw new NodoDestinoNoEncontradoException();
      if (detalle.includes('origen'))
        throw new NodoOrigenNoEncontradoException();
      throw new FlujoConversacionalNoEncontradoException();
    }
    throw error;
  }

  private esErrorPrisma(error: unknown, codigo: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === codigo
    );
  }

  private obtenerDetalle(error: unknown): string {
    if (typeof error !== 'object' || error === null) return '';
    const prismaError = error as {
      message?: string;
      meta?: unknown;
      cause?: unknown;
    };
    return [
      prismaError.message,
      this.serializar(prismaError.meta),
      this.serializar(prismaError.cause),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private serializar(valor: unknown): string {
    if (valor === null || valor === undefined) return '';
    try {
      return typeof valor === 'string' ? valor : JSON.stringify(valor);
    } catch {
      return 'valor no serializable';
    }
  }

  private async ejecutarTransaccion<T>(
    operacion: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const maximoIntentos = 3;
    for (let intento = 1; intento <= maximoIntentos; intento += 1) {
      try {
        return await this.prisma.$transaction(operacion, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        if (!this.esErrorPrisma(error, 'P2034') || intento === maximoIntentos) {
          throw error;
        }
      }
    }

    throw new Error('No fue posible completar la transacción serializable.');
  }
}
