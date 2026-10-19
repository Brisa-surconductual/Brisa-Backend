import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ArbolConversacional,
  AuditoriaArbolConversacional,
  FlujoConversacional,
  NodoConversacional,
  ReglaValidacion,
  TipoEntradaConversacional,
  TipoNodoConversacional,
  TransicionConversacional,
} from '../../domain/entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  OperadorCondicion,
  TipoCravingClinico,
  TipoDatoValidacion,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  ContenidoCronogramaNoEncontradoException,
  EstadoFlujoInvalidoException,
  GrafoInvalidoException,
  PublicadoPorPerfilExistenteException,
  FlujoConversacionalNoEditableException,
  FlujoConversacionalNoEncontradoException,
  FlujoGrupalPublicadoExistenteException,
  FlujoPersonalizadoArchivadoException,
  FlujoPersonalizadoNoEncontradoException,
  FlujoPersonalizadoPublicadoExistenteException,
  FlujoPersonalizadoYaArchivadoException,
  NodoConversacionalDuplicadoException,
  NodoConversacionalNoEncontradoException,
  NodoDestinoNoEncontradoException,
  NodoInicialDuplicadoException,
  NodoFueraDeFlujoException,
  NodoOrigenNoEncontradoException,
  OrdenTransicionDuplicadoException,
  PerfilClinicoArbolInvalidoException,
  ReglaValidacionInvalidaException,
  ReglaValidacionNoEncontradaException,
  TipoNodoNoEncontradoException,
  TransicionConversacionalNoEncontradaException,
  VersionPersonalizadaDuplicadaException,
  VersionPersonalizadaNoClonableException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import {
  ActualizarNodoCommand,
  ActualizarTransicionCommand,
  ArbolConversacionalRepository,
  ConsultaFlujos,
  CrearFlujoGrupalCommand,
  CrearFlujoPersonalizadoCommand,
  CrearNodoCommand,
  CrearReglaValidacionCommand,
  CrearTransicionCommand,
  DatosReglaValidacionCommand,
  PerfilClinicoArbol,
  PaginaFlujos,
  VersionClonada,
} from '../../domain/repositories/arbol-conversacional.repository';

type ClienteArbol = Pick<
  Prisma.TransactionClient,
  | 'flujo_conversacion'
  | 'nodos'
  | 'reglas_nodos'
  | 'reglas_validaciones'
  | 'tipo_nodo'
>;

interface FlujoRow {
  id_flujo: string;
  nombre: string;
  modalidad: string;
  estado: string;
  version: number;
  creado_por: string;
  fecha_creacion: Date;
  fecha_publicacion: Date | null;
  fecha_archivado: Date | null;
  tipo_dependencia: string | null;
  tipo_craving: string | null;
}

interface NodoRow {
  id_nodo: string;
  id_flujo: string;
  id_tipo_nodo: string;
  contenido: Prisma.JsonValue;
  es_nodo_inicial: boolean;
  orden: number | null;
  id_contenido_cronograma: string | null;
  creado_por: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  tipo_nodo: { nombre: string };
}

interface TransicionRow {
  id_regla: string;
  id_flujo: string;
  id_nodo_origen: string;
  id_nodo_destino: string;
  id_regla_validacion: string;
  operador_condicion: string;
  valor_condicion: Prisma.JsonValue;
  orden_evaluacion: number;
  fecha_creacion: Date;
  reglas_validaciones: {
    id_regla_validacion: string;
    tipo_dato: string;
    obligatorio: boolean;
    valor_min: Prisma.Decimal | null;
    valor_max: Prisma.Decimal | null;
    formato_regex: string | null;
    valores_permitidos: string[];
    mensaje_error: string;
  };
}

@Injectable()
export class PrismaArbolConversacionalRepository implements ArbolConversacionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearFlujoGrupal(
    command: CrearFlujoGrupalCommand,
  ): Promise<FlujoConversacional> {
    return this.ejecutarTransaccion(async (tx) => {
      const flujo = await tx.flujo_conversacion.create({
        data: {
          nombre: command.nombre,
          modalidad: ModalidadConversacional.GRUPAL,
          estado: EstadoFlujoConversacional.BORRADOR,
          version: command.version,
          creado_por: command.creadoPor,
        },
      });
      await this.auditar(tx, flujo.id_flujo, command.creadoPor, 'CREAR_FLUJO');
      return this.mapearFlujo(flujo);
    });
  }

  async crearFlujoPersonalizado(
    command: CrearFlujoPersonalizadoCommand,
  ): Promise<FlujoConversacional> {
    this.validarPerfil(command);
    try {
      return await this.ejecutarTransaccion(async (tx) => {
        const version = await this.siguienteVersion(tx, command);
        const flujo = await tx.flujo_conversacion.create({
          data: {
            nombre: command.nombre,
            modalidad: ModalidadConversacional.PERSONALIZADA,
            tipo_dependencia: command.tipoDependencia,
            tipo_craving: command.tipoCraving,
            estado: EstadoFlujoConversacional.BORRADOR,
            version,
            creado_por: command.creadoPor,
          },
        });
        await this.auditar(
          tx,
          flujo.id_flujo,
          command.creadoPor,
          'CREAR_FLUJO',
        );
        return this.mapearFlujo(flujo);
      });
    } catch (error: unknown) {
      this.traducirErrorVersion(error);
    }
  }

  async clonarVersionPersonalizada(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional> {
    return (await this.clonarArbol(idFlujo, idActor, false)).flujo;
  }

  clonarVersion(idFlujo: string, idActor: string): Promise<VersionClonada> {
    return this.clonarArbol(idFlujo, idActor, true);
  }

  private async clonarArbol(
    idFlujo: string,
    idActor: string,
    contratoAdministrativo: boolean,
  ): Promise<VersionClonada> {
    try {
      return await this.ejecutarTransaccion(async (tx) => {
        const origen = await this.cargarArbol(tx, idFlujo);
        if (
          origen === null ||
          (!contratoAdministrativo &&
            origen.flujo.modalidad !== ModalidadConversacional.PERSONALIZADA)
        ) {
          if (contratoAdministrativo)
            throw new FlujoConversacionalNoEncontradoException();
          throw new FlujoPersonalizadoNoEncontradoException();
        }
        if (origen.flujo.estado === EstadoFlujoConversacional.BORRADOR) {
          if (contratoAdministrativo) throw new EstadoFlujoInvalidoException();
          throw new VersionPersonalizadaNoClonableException();
        }
        const perfil =
          origen.flujo.modalidad === ModalidadConversacional.PERSONALIZADA
            ? this.perfilDeFlujo(origen.flujo)
            : null;
        const version = contratoAdministrativo
          ? origen.flujo.version + 1
          : await this.siguienteVersion(tx, perfil!);
        const nuevo = await tx.flujo_conversacion.create({
          data: {
            nombre: origen.flujo.nombre,
            modalidad: origen.flujo.modalidad,
            tipo_dependencia: perfil?.tipoDependencia ?? null,
            tipo_craving: perfil?.tipoCraving ?? null,
            estado: EstadoFlujoConversacional.BORRADOR,
            version,
            creado_por: idActor,
          },
        });
        const idsNuevos = new Map<string, string>();
        for (const nodo of origen.nodos) {
          const creado = await tx.nodos.create({
            data: {
              id_flujo: nuevo.id_flujo,
              id_tipo_nodo: nodo.idTipoNodo,
              contenido: nodo.contenido as Prisma.InputJsonValue,
              es_nodo_inicial: nodo.esNodoInicial,
              orden: nodo.orden,
              id_contenido_cronograma: nodo.idContenidoCronograma,
              creado_por: idActor,
            },
          });
          idsNuevos.set(nodo.idNodo, creado.id_nodo);
        }
        for (const transicion of origen.transiciones) {
          const regla = transicion.reglaValidacion;
          let idValidacion = regla.idReglaValidacion;
          if (!contratoAdministrativo) {
            const validacion = await tx.reglas_validaciones.create({
              data: this.datosCrearRegla({
                tipoDato: regla.tipoDato,
                obligatorio: regla.obligatorio,
                valorMin: regla.valorMin,
                valorMax: regla.valorMax,
                formatoRegex: regla.formatoRegex,
                valoresPermitidos: regla.valoresPermitidos,
                mensajeError: regla.mensajeError,
              }),
            });
            idValidacion = validacion.id_regla_validacion;
          }
          const origenNuevo = idsNuevos.get(transicion.idNodoOrigen);
          const destinoNuevo = idsNuevos.get(transicion.idNodoDestino);
          if (origenNuevo === undefined || destinoNuevo === undefined) {
            throw new FlujoConversacionalNoEditableException();
          }
          await tx.reglas_nodos.create({
            data: {
              id_flujo: nuevo.id_flujo,
              id_nodo_origen: origenNuevo,
              id_nodo_destino: destinoNuevo,
              id_regla_validacion: idValidacion,
              operador_condicion: transicion.operadorCondicion,
              valor_condicion: this.aJsonEntrada(transicion.valorCondicion),
              orden_evaluacion: transicion.ordenEvaluacion,
            },
          });
        }
        await this.auditar(
          tx,
          nuevo.id_flujo,
          idActor,
          'CLONAR_VERSION',
          idFlujo,
        );
        return {
          flujo: this.mapearFlujo(nuevo),
          idFlujoOrigen: idFlujo,
          nodosCopiados: origen.nodos.length,
          transicionesCopiadas: origen.transiciones.length,
        };
      });
    } catch (error: unknown) {
      this.traducirErrorVersion(error);
    }
  }

  async listarFlujos(consulta: ConsultaFlujos): Promise<PaginaFlujos> {
    const where: Prisma.flujo_conversacionWhereInput = {
      modalidad: consulta.modalidad,
      tipo_dependencia: consulta.tipoDependencia,
      tipo_craving: consulta.tipoCraving,
      estado: consulta.estado,
    };
    return this.ejecutarTransaccion(async (tx) => {
      const [items, total] = await Promise.all([
        tx.flujo_conversacion.findMany({
          where,
          orderBy: [{ fecha_creacion: 'desc' }, { id_flujo: 'asc' }],
          skip: (consulta.page - 1) * consulta.pageSize,
          take: consulta.pageSize,
        }),
        tx.flujo_conversacion.count({ where }),
      ]);
      return { items: items.map((flujo) => this.mapearFlujo(flujo)), total };
    });
  }

  async publicarAdministrativo(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional> {
    let perfil: PerfilClinicoArbol | undefined;
    let modalidad: ModalidadConversacional | undefined;
    try {
      return await this.ejecutarTransaccion(async (tx) => {
        const arbol = await this.cargarArbol(tx, idFlujo);
        if (arbol === null)
          throw new FlujoConversacionalNoEncontradoException();
        modalidad = arbol.flujo.modalidad;
        if (arbol.flujo.estado !== EstadoFlujoConversacional.BORRADOR) {
          throw new EstadoFlujoInvalidoException();
        }
        const detalles = arbol.diagnosticarEstructura();
        if (
          detalles.sin_nodo_inicial ||
          detalles.nodos_huerfanos.length > 0 ||
          detalles.ciclos.length > 0
        ) {
          throw new GrafoInvalidoException(detalles);
        }
        if (modalidad === ModalidadConversacional.PERSONALIZADA) {
          perfil = this.perfilDeFlujo(arbol.flujo);
          const publicado = await tx.flujo_conversacion.findFirst({
            where: this.filtroPublicado(perfil),
            select: { id_flujo: true },
          });
          if (publicado !== null)
            throw new PublicadoPorPerfilExistenteException(publicado.id_flujo);
        }
        const flujo = await tx.flujo_conversacion.update({
          where: { id_flujo: idFlujo },
          data: {
            estado: EstadoFlujoConversacional.PUBLICADO,
            fecha_publicacion: new Date(),
          },
        });
        await this.auditar(tx, idFlujo, idActor, 'PUBLICAR');
        return this.mapearFlujo(flujo);
      });
    } catch (error: unknown) {
      const detalle = this.obtenerDetalle(error);
      const conflictoIndice =
        this.esErrorPrisma(error, 'P2002') &&
        (detalle.includes('uq_flujo_publicado_personalizada') ||
          ['modalidad', 'tipo_dependencia', 'tipo_craving'].every((campo) =>
            detalle.includes(campo),
          ));
      if (
        perfil !== undefined &&
        (conflictoIndice || this.esErrorPrisma(error, 'P2034'))
      ) {
        // La transacción fallida ya terminó: consultar al ganador en una instantánea nueva.
        const publicado = await this.prisma.flujo_conversacion.findFirst({
          where: this.filtroPublicado(perfil),
          select: { id_flujo: true },
        });
        if (publicado !== null)
          throw new PublicadoPorPerfilExistenteException(publicado.id_flujo);
      }
      if (
        modalidad === ModalidadConversacional.GRUPAL &&
        this.esErrorPrisma(error, 'P2002') &&
        (detalle.includes('uq_flujo_publicado_grupal') ||
          (detalle.includes('modalidad') &&
            !detalle.includes('tipo_dependencia')))
      ) {
        throw new FlujoGrupalPublicadoExistenteException();
      }
      throw error;
    }
  }

  async archivarAdministrativo(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional> {
    return this.ejecutarTransaccion(async (tx) => {
      const flujo = await tx.flujo_conversacion.findUnique({
        where: { id_flujo: idFlujo },
      });
      if (flujo === null) throw new FlujoConversacionalNoEncontradoException();
      if (
        String(flujo.estado) !== String(EstadoFlujoConversacional.BORRADOR) &&
        String(flujo.estado) !== String(EstadoFlujoConversacional.PUBLICADO)
      ) {
        throw new EstadoFlujoInvalidoException();
      }
      const archivado = await tx.flujo_conversacion.update({
        where: { id_flujo: idFlujo },
        data: {
          estado: EstadoFlujoConversacional.ARCHIVADO,
          fecha_archivado: new Date(),
        },
      });
      await this.auditar(tx, idFlujo, idActor, 'ARCHIVAR');
      return this.mapearFlujo(archivado);
    });
  }

  private filtroPublicado(
    perfil: PerfilClinicoArbol,
  ): Prisma.flujo_conversacionWhereInput {
    return {
      modalidad: ModalidadConversacional.PERSONALIZADA,
      tipo_dependencia: perfil.tipoDependencia,
      tipo_craving: perfil.tipoCraving,
      estado: EstadoFlujoConversacional.PUBLICADO,
    };
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
    return flujos.map((flujo) => this.mapearFlujo(flujo));
  }

  async buscarPublicadoPersonalizado(
    perfil: PerfilClinicoArbol,
  ): Promise<FlujoConversacional | null> {
    this.validarPerfil(perfil);
    const flujo = await this.prisma.flujo_conversacion.findFirst({
      where: {
        modalidad: ModalidadConversacional.PERSONALIZADA,
        tipo_dependencia: perfil.tipoDependencia,
        tipo_craving: perfil.tipoCraving,
        estado: EstadoFlujoConversacional.PUBLICADO,
      },
    });
    return flujo === null ? null : this.mapearFlujo(flujo);
  }

  async listarAuditoriaArbol(
    idFlujo: string,
  ): Promise<AuditoriaArbolConversacional[]> {
    const flujo = await this.prisma.flujo_conversacion.findUnique({
      where: { id_flujo: idFlujo },
      select: { modalidad: true },
    });
    if (
      flujo === null ||
      String(flujo.modalidad) !== String(ModalidadConversacional.PERSONALIZADA)
    ) {
      throw new FlujoPersonalizadoNoEncontradoException();
    }
    const registros = await this.prisma.auditoria_arboles.findMany({
      where: { id_flujo: idFlujo },
      orderBy: { id_auditoria: 'asc' },
    });
    return registros.map(
      (registro) =>
        new AuditoriaArbolConversacional(
          BigInt(registro.id_auditoria),
          idFlujo,
          registro.id_actor,
          registro.accion,
          registro.id_objeto,
          registro.fecha_operacion,
        ),
    );
  }

  async publicarPersonalizado(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional> {
    try {
      return await this.ejecutarTransaccion(async (tx) => {
        const arbol = await this.cargarArbol(tx, idFlujo);
        if (
          arbol === null ||
          arbol.flujo.modalidad !== ModalidadConversacional.PERSONALIZADA
        ) {
          throw new FlujoPersonalizadoNoEncontradoException();
        }
        if (arbol.flujo.estado === EstadoFlujoConversacional.ARCHIVADO) {
          throw new FlujoPersonalizadoArchivadoException();
        }
        if (arbol.flujo.estado !== EstadoFlujoConversacional.BORRADOR) {
          throw new FlujoConversacionalNoEditableException();
        }
        const perfil = this.perfilDeFlujo(arbol.flujo);
        arbol.validarEstructura();

        const anterior = await tx.flujo_conversacion.findFirst({
          where: {
            modalidad: ModalidadConversacional.PERSONALIZADA,
            tipo_dependencia: perfil.tipoDependencia,
            tipo_craving: perfil.tipoCraving,
            estado: EstadoFlujoConversacional.PUBLICADO,
          },
        });
        const ahora = new Date();
        if (anterior !== null) {
          await tx.flujo_conversacion.update({
            where: { id_flujo: anterior.id_flujo },
            data: {
              estado: EstadoFlujoConversacional.ARCHIVADO,
              fecha_archivado: ahora,
            },
          });
          await this.auditar(tx, anterior.id_flujo, idActor, 'ARCHIVAR');
        }
        const publicado = await tx.flujo_conversacion.update({
          where: { id_flujo: idFlujo },
          data: {
            estado: EstadoFlujoConversacional.PUBLICADO,
            fecha_publicacion: ahora,
          },
        });
        await this.auditar(tx, idFlujo, idActor, 'PUBLICAR');
        return this.mapearFlujo(publicado);
      });
    } catch (error: unknown) {
      this.traducirErrorPublicacionPersonalizada(error);
    }
  }

  async archivarPersonalizado(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional> {
    return this.ejecutarTransaccion(async (tx) => {
      const flujo = await tx.flujo_conversacion.findUnique({
        where: { id_flujo: idFlujo },
      });
      if (
        flujo === null ||
        String(flujo.modalidad) !==
          String(ModalidadConversacional.PERSONALIZADA)
      ) {
        throw new FlujoPersonalizadoNoEncontradoException();
      }
      if (
        String(flujo.estado) === String(EstadoFlujoConversacional.ARCHIVADO)
      ) {
        throw new FlujoPersonalizadoYaArchivadoException();
      }
      const archivado = await tx.flujo_conversacion.update({
        where: { id_flujo: idFlujo },
        data: {
          estado: EstadoFlujoConversacional.ARCHIVADO,
          fecha_archivado: new Date(),
        },
      });
      await this.auditar(tx, idFlujo, idActor, 'ARCHIVAR');
      return this.mapearFlujo(archivado);
    });
  }

  obtenerArbol(idFlujo: string): Promise<ArbolConversacional | null> {
    return this.cargarArbol(this.prisma, idFlujo);
  }

  async listarTiposNodo(): Promise<TipoNodoConversacional[]> {
    const tipos = await this.prisma.tipo_nodo.findMany({
      orderBy: { nombre: 'asc' },
    });
    return tipos.map(
      (tipo) => new TipoNodoConversacional(tipo.id_tipo_nodo, tipo.nombre),
    );
  }

  async listarTiposEntrada(): Promise<TipoEntradaConversacional[]> {
    const tipos = await this.prisma.tipo_entrada.findMany({
      orderBy: { nombre: 'asc' },
    });
    return tipos.map(
      (tipo) =>
        new TipoEntradaConversacional(tipo.id_tipo_entrada, tipo.nombre),
    );
  }

  async listarReglasValidacion(): Promise<ReglaValidacion[]> {
    const reglas = await this.prisma.reglas_validaciones.findMany({
      orderBy: { id_regla_validacion: 'asc' },
    });
    return reglas.map((regla) => this.mapearRegla(regla));
  }

  async buscarNodo(idNodo: string): Promise<NodoConversacional | null> {
    const nodo = await this.prisma.nodos.findUnique({
      where: { id_nodo: idNodo },
      include: { tipo_nodo: { select: { nombre: true } } },
    });
    return nodo === null ? null : this.mapearNodo(nodo);
  }

  async buscarTransicion(
    idTransicion: string,
  ): Promise<TransicionConversacional | null> {
    const transicion = await this.prisma.reglas_nodos.findUnique({
      where: { id_regla: idTransicion },
      include: { reglas_validaciones: true },
    });
    return transicion === null ? null : this.mapearTransicion(transicion);
  }

  async crearReglaValidacion(
    command: CrearReglaValidacionCommand,
  ): Promise<ReglaValidacion> {
    this.crearReglaDominio('validacion-previa', command);
    return this.ejecutarTransaccion(async (tx) => {
      const regla = await tx.reglas_validaciones.create({
        data: this.datosCrearRegla(command),
      });
      await this.auditar(
        tx,
        null,
        command.creadoPor,
        'CREAR_REGLA_VALIDACION',
        regla.id_regla_validacion,
      );
      return this.mapearRegla(regla);
    });
  }

  async crearNodo(command: CrearNodoCommand): Promise<NodoConversacional> {
    try {
      return await this.ejecutarTransaccion(async (tx) => {
        await this.asegurarFlujoEditable(tx, command.idFlujo);
        await this.asegurarTipoNodo(tx, command.idTipoNodo);

        const nodo = await tx.nodos.create({
          data: {
            id_flujo: command.idFlujo,
            id_tipo_nodo: command.idTipoNodo,
            contenido: command.contenido as Prisma.InputJsonValue,
            es_nodo_inicial: command.esNodoInicial,
            orden: command.orden,
            id_contenido_cronograma: command.idContenidoCronograma,
            creado_por: command.creadoPor,
          },
          include: { tipo_nodo: { select: { nombre: true } } },
        });

        await this.auditar(
          tx,
          command.idFlujo,
          command.creadoPor,
          'CREAR_NODO',
          nodo.id_nodo,
        );

        return this.mapearNodo(nodo);
      });
    } catch (error: unknown) {
      this.traducirErrorNodo(error);
    }
  }

  async actualizarNodo(
    command: ActualizarNodoCommand,
  ): Promise<NodoConversacional> {
    try {
      return await this.ejecutarTransaccion(async (tx) => {
        await this.asegurarFlujoEditable(tx, command.idFlujo);
        const existente = await tx.nodos.findFirst({
          where: { id_nodo: command.idNodo, id_flujo: command.idFlujo },
          select: { id_nodo: true },
        });
        if (existente === null) {
          throw new NodoConversacionalNoEncontradoException();
        }
        if (command.idTipoNodo !== undefined) {
          await this.asegurarTipoNodo(tx, command.idTipoNodo);
        }

        const data: Prisma.nodosUncheckedUpdateInput = {
          id_tipo_nodo: command.idTipoNodo,
          contenido:
            command.contenido === undefined
              ? undefined
              : (command.contenido as Prisma.InputJsonValue),
          es_nodo_inicial: command.esNodoInicial,
          orden: command.orden,
          id_contenido_cronograma: command.idContenidoCronograma,
          fecha_actualizacion: new Date(),
        };
        const nodo = await tx.nodos.update({
          where: { id_nodo: command.idNodo },
          data,
          include: { tipo_nodo: { select: { nombre: true } } },
        });
        await this.auditar(
          tx,
          command.idFlujo,
          command.actualizadoPor,
          'EDITAR_NODO',
          nodo.id_nodo,
        );
        return this.mapearNodo(nodo);
      });
    } catch (error: unknown) {
      this.traducirErrorNodo(error);
    }
  }

  async crearTransicion(
    command: CrearTransicionCommand,
  ): Promise<TransicionConversacional> {
    try {
      return await this.ejecutarTransaccion(async (tx) => {
        await this.asegurarFlujoEditable(tx, command.idFlujo);
        await this.asegurarNodosDelFlujo(
          tx,
          command.idFlujo,
          command.idNodoOrigen,
          command.idNodoDestino,
        );

        if (
          (command.idReglaValidacion === undefined) ===
          (command.reglaValidacion === undefined)
        ) {
          throw new ReglaValidacionInvalidaException(
            'Debe indicar una regla existente o una regla embebida, exclusivamente.',
          );
        }
        const regla =
          command.idReglaValidacion !== undefined
            ? await this.cargarRegla(tx, command.idReglaValidacion)
            : this.crearReglaDominio(
                'regla-validacion-temporal',
                command.reglaValidacion!,
              );
        const arbol = await this.cargarArbol(tx, command.idFlujo);
        if (arbol === null)
          throw new FlujoConversacionalNoEncontradoException();
        new ArbolConversacional(arbol.flujo, arbol.nodos, [
          ...arbol.transiciones,
          new TransicionConversacional(
            'transicion-temporal',
            command.idFlujo,
            command.idNodoOrigen,
            command.idNodoDestino,
            command.operadorCondicion,
            command.valorCondicion,
            command.ordenEvaluacion,
            regla,
            new Date(),
          ),
        ]).validarAusenciaCiclos();

        const idReglaValidacion =
          command.idReglaValidacion ??
          (
            await tx.reglas_validaciones.create({
              data: this.datosCrearRegla(command.reglaValidacion!),
            })
          ).id_regla_validacion;
        const transicion = await tx.reglas_nodos.create({
          data: {
            id_flujo: command.idFlujo,
            id_nodo_origen: command.idNodoOrigen,
            id_nodo_destino: command.idNodoDestino,
            id_regla_validacion: idReglaValidacion,
            operador_condicion: command.operadorCondicion,
            valor_condicion: this.aJsonEntrada(command.valorCondicion),
            orden_evaluacion: command.ordenEvaluacion,
          },
          include: { reglas_validaciones: true },
        });
        await this.auditar(
          tx,
          command.idFlujo,
          command.creadoPor,
          'CREAR_TRANSICION',
          transicion.id_regla,
        );
        return this.mapearTransicion(transicion);
      });
    } catch (error: unknown) {
      this.traducirErrorTransicion(error);
    }
  }

  async actualizarTransicion(
    command: ActualizarTransicionCommand,
  ): Promise<TransicionConversacional> {
    try {
      return await this.ejecutarTransaccion(async (tx) => {
        await this.asegurarFlujoEditable(tx, command.idFlujo);
        const existente = await tx.reglas_nodos.findFirst({
          where: {
            id_regla: command.idTransicion,
            id_flujo: command.idFlujo,
          },
          include: { reglas_validaciones: true },
        });
        if (existente === null) {
          throw new TransicionConversacionalNoEncontradaException();
        }

        const idOrigen = command.idNodoOrigen ?? existente.id_nodo_origen;
        const idDestino = command.idNodoDestino ?? existente.id_nodo_destino;
        await this.asegurarNodosDelFlujo(
          tx,
          command.idFlujo,
          idOrigen,
          idDestino,
        );

        const actual = existente.reglas_validaciones;
        const cambios = command.reglaValidacion;
        const datosRegla: DatosReglaValidacionCommand = {
          tipoDato:
            cambios?.tipoDato ?? (actual.tipo_dato as TipoDatoValidacion),
          obligatorio: cambios?.obligatorio ?? actual.obligatorio,
          valorMin:
            cambios?.valorMin === undefined
              ? this.decimalANumero(actual.valor_min)
              : cambios.valorMin,
          valorMax:
            cambios?.valorMax === undefined
              ? this.decimalANumero(actual.valor_max)
              : cambios.valorMax,
          formatoRegex:
            cambios?.formatoRegex === undefined
              ? actual.formato_regex
              : cambios.formatoRegex,
          valoresPermitidos:
            cambios?.valoresPermitidos ?? actual.valores_permitidos ?? [],
          mensajeError: cambios?.mensajeError ?? actual.mensaje_error,
        };
        if (command.idReglaValidacion !== undefined && cambios !== undefined) {
          throw new ReglaValidacionInvalidaException(
            'No se puede sustituir una regla y editar su definición simultáneamente.',
          );
        }
        const reglaDominio =
          command.idReglaValidacion === undefined
            ? this.crearReglaDominio(actual.id_regla_validacion, datosRegla)
            : await this.cargarRegla(tx, command.idReglaValidacion);

        const arbol = await this.cargarArbol(tx, command.idFlujo);
        if (arbol === null)
          throw new FlujoConversacionalNoEncontradoException();
        const transicionSimulada = new TransicionConversacional(
          existente.id_regla,
          command.idFlujo,
          idOrigen,
          idDestino,
          command.operadorCondicion ??
            (existente.operador_condicion as OperadorCondicion),
          command.valorCondicion === undefined
            ? existente.valor_condicion
            : command.valorCondicion,
          command.ordenEvaluacion ?? existente.orden_evaluacion,
          reglaDominio,
          existente.fecha_creacion,
        );
        new ArbolConversacional(
          arbol.flujo,
          arbol.nodos,
          arbol.transiciones.map((transicion) =>
            transicion.idTransicion === command.idTransicion
              ? transicionSimulada
              : transicion,
          ),
        ).validarAusenciaCiclos();

        let idReglaValidacion = command.idReglaValidacion;
        if (cambios !== undefined) {
          const usos = await tx.reglas_nodos.count({
            where: { id_regla_validacion: actual.id_regla_validacion },
          });
          if (usos > 1) {
            const copia = await tx.reglas_validaciones.create({
              data: this.datosCrearRegla(datosRegla),
            });
            idReglaValidacion = copia.id_regla_validacion;
          } else {
            await tx.reglas_validaciones.update({
              where: { id_regla_validacion: actual.id_regla_validacion },
              data: this.datosActualizarRegla(datosRegla),
            });
          }
        }
        const transicion = await tx.reglas_nodos.update({
          where: { id_regla: command.idTransicion },
          data: {
            id_regla_validacion: idReglaValidacion,
            id_nodo_origen: command.idNodoOrigen,
            id_nodo_destino: command.idNodoDestino,
            operador_condicion: command.operadorCondicion,
            valor_condicion:
              command.valorCondicion === undefined
                ? undefined
                : this.aJsonEntrada(command.valorCondicion),
            orden_evaluacion: command.ordenEvaluacion,
          },
          include: { reglas_validaciones: true },
        });
        await this.auditar(
          tx,
          command.idFlujo,
          command.actualizadoPor,
          'EDITAR_TRANSICION',
          transicion.id_regla,
        );
        return this.mapearTransicion(transicion);
      });
    } catch (error: unknown) {
      this.traducirErrorTransicion(error);
    }
  }

  async publicar(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional> {
    try {
      return await this.ejecutarTransaccion(async (tx) => {
        await this.asegurarFlujoEditable(tx, idFlujo);
        const arbol = await this.cargarArbol(tx, idFlujo);
        if (arbol === null)
          throw new FlujoConversacionalNoEncontradoException();
        if (arbol.flujo.modalidad !== ModalidadConversacional.GRUPAL) {
          throw new FlujoConversacionalNoEditableException();
        }
        arbol.validarEstructura();

        const flujo = await tx.flujo_conversacion.update({
          where: { id_flujo: idFlujo },
          data: {
            estado: EstadoFlujoConversacional.PUBLICADO,
            fecha_publicacion: new Date(),
          },
        });
        await this.auditar(tx, idFlujo, idActor, 'PUBLICAR');
        return this.mapearFlujo(flujo);
      });
    } catch (error: unknown) {
      if (this.esErrorPrisma(error, 'P2002')) {
        throw new FlujoGrupalPublicadoExistenteException();
      }
      if (error instanceof HttpException) throw error;
      throw error;
    }
  }

  private async cargarArbol(
    cliente: ClienteArbol,
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
        include: { reglas_validaciones: true },
        orderBy: [{ id_nodo_origen: 'asc' }, { orden_evaluacion: 'asc' }],
      }),
    ]);

    return new ArbolConversacional(
      this.mapearFlujo(flujo),
      nodos.map((nodo) => this.mapearNodo(nodo)),
      transiciones.map((transicion) => this.mapearTransicion(transicion)),
    );
  }

  private async asegurarFlujoEditable(
    cliente: ClienteArbol,
    idFlujo: string,
  ): Promise<void> {
    const flujo = await cliente.flujo_conversacion.findUnique({
      where: { id_flujo: idFlujo },
      select: { estado: true },
    });
    if (flujo === null) throw new FlujoConversacionalNoEncontradoException();
    if (String(flujo.estado) !== String(EstadoFlujoConversacional.BORRADOR)) {
      throw new FlujoConversacionalNoEditableException();
    }
  }

  private async asegurarTipoNodo(
    cliente: ClienteArbol,
    idTipoNodo: string,
  ): Promise<void> {
    const tipo = await cliente.tipo_nodo.findUnique({
      where: { id_tipo_nodo: idTipoNodo },
      select: { id_tipo_nodo: true },
    });
    if (tipo === null) throw new TipoNodoNoEncontradoException();
  }

  private async asegurarNodosDelFlujo(
    cliente: ClienteArbol,
    idFlujo: string,
    idOrigen: string,
    idDestino: string,
  ): Promise<void> {
    const nodos = await cliente.nodos.findMany({
      where: { id_nodo: { in: [idOrigen, idDestino] } },
      select: { id_nodo: true, id_flujo: true },
    });
    const ids = new Set(nodos.map((nodo) => nodo.id_nodo));
    if (!ids.has(idOrigen)) throw new NodoOrigenNoEncontradoException();
    if (!ids.has(idDestino)) throw new NodoDestinoNoEncontradoException();
    if (nodos.some((nodo) => nodo.id_flujo !== idFlujo)) {
      throw new NodoFueraDeFlujoException();
    }
  }

  private async cargarRegla(
    cliente: ClienteArbol,
    idRegla: string,
  ): Promise<ReglaValidacion> {
    const regla = await cliente.reglas_validaciones.findUnique({
      where: { id_regla_validacion: idRegla },
    });
    if (regla === null) throw new ReglaValidacionNoEncontradaException();
    return this.mapearRegla(regla);
  }

  private crearReglaDominio(
    idRegla: string,
    datos: DatosReglaValidacionCommand,
  ): ReglaValidacion {
    return new ReglaValidacion(
      idRegla,
      datos.tipoDato,
      datos.obligatorio,
      datos.valorMin,
      datos.valorMax,
      datos.formatoRegex,
      datos.valoresPermitidos,
      datos.mensajeError,
    );
  }

  private datosCrearRegla(
    datos: DatosReglaValidacionCommand,
  ): Prisma.reglas_validacionesCreateInput {
    return {
      tipo_dato: datos.tipoDato,
      obligatorio: datos.obligatorio,
      valor_min: datos.valorMin,
      valor_max: datos.valorMax,
      formato_regex: datos.formatoRegex,
      valores_permitidos: datos.valoresPermitidos,
      mensaje_error: datos.mensajeError,
    };
  }

  private datosActualizarRegla(
    datos: DatosReglaValidacionCommand,
  ): Prisma.reglas_validacionesUpdateInput {
    return this.datosCrearRegla(datos);
  }

  private validarPerfil(perfil: PerfilClinicoArbol): void {
    if (
      !Object.values(TipoDependenciaClinica).includes(perfil.tipoDependencia) ||
      !Object.values(TipoCravingClinico).includes(perfil.tipoCraving)
    ) {
      throw new PerfilClinicoArbolInvalidoException();
    }
  }

  private perfilDeFlujo(flujo: FlujoConversacional): PerfilClinicoArbol {
    const perfil = {
      tipoDependencia: flujo.tipoDependencia as TipoDependenciaClinica,
      tipoCraving: flujo.tipoCraving as TipoCravingClinico,
    };
    this.validarPerfil(perfil);
    return perfil;
  }

  private async siguienteVersion(
    tx: Prisma.TransactionClient,
    perfil: PerfilClinicoArbol,
  ): Promise<number> {
    const ultima = await tx.flujo_conversacion.findFirst({
      where: {
        modalidad: ModalidadConversacional.PERSONALIZADA,
        tipo_dependencia: perfil.tipoDependencia,
        tipo_craving: perfil.tipoCraving,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return (ultima?.version ?? 0) + 1;
  }

  private async auditar(
    tx: Prisma.TransactionClient,
    idFlujo: string | null,
    idActor: string,
    accion: string,
    idObjeto: string | null = null,
  ): Promise<void> {
    await tx.auditoria_arboles.create({
      data: {
        id_flujo: idFlujo,
        id_actor: idActor,
        accion,
        id_objeto: idObjeto,
      },
    });
  }

  private traducirErrorVersion(error: unknown): never {
    if (error instanceof HttpException) throw error;
    if (this.esErrorPrisma(error, 'P2002')) {
      throw new VersionPersonalizadaDuplicadaException();
    }
    throw error;
  }

  private traducirErrorPublicacionPersonalizada(error: unknown): never {
    if (error instanceof HttpException) throw error;
    if (this.esErrorPrisma(error, 'P2002')) {
      throw new FlujoPersonalizadoPublicadoExistenteException();
    }
    throw error;
  }

  private mapearFlujo(flujo: FlujoRow): FlujoConversacional {
    return new FlujoConversacional(
      flujo.id_flujo,
      flujo.nombre,
      flujo.modalidad as ModalidadConversacional,
      flujo.estado as EstadoFlujoConversacional,
      flujo.version,
      flujo.creado_por,
      flujo.fecha_creacion,
      flujo.fecha_publicacion,
      flujo.tipo_dependencia as TipoDependenciaClinica | null,
      flujo.tipo_craving as TipoCravingClinico | null,
      flujo.fecha_archivado,
    );
  }

  private mapearNodo(nodo: NodoRow): NodoConversacional {
    return new NodoConversacional(
      nodo.id_nodo,
      nodo.id_flujo,
      nodo.id_tipo_nodo,
      nodo.tipo_nodo.nombre,
      nodo.contenido as Record<string, unknown>,
      nodo.es_nodo_inicial,
      nodo.orden,
      nodo.id_contenido_cronograma,
      nodo.creado_por,
      nodo.fecha_creacion,
      nodo.fecha_actualizacion,
    );
  }

  private mapearTransicion(
    transicion: TransicionRow,
  ): TransicionConversacional {
    return new TransicionConversacional(
      transicion.id_regla,
      transicion.id_flujo,
      transicion.id_nodo_origen,
      transicion.id_nodo_destino,
      transicion.operador_condicion as OperadorCondicion,
      transicion.valor_condicion,
      transicion.orden_evaluacion,
      this.mapearRegla(transicion.reglas_validaciones),
      transicion.fecha_creacion,
    );
  }

  private mapearRegla(
    validacion: TransicionRow['reglas_validaciones'],
  ): ReglaValidacion {
    return new ReglaValidacion(
      validacion.id_regla_validacion,
      validacion.tipo_dato as TipoDatoValidacion,
      validacion.obligatorio,
      this.decimalANumero(validacion.valor_min),
      this.decimalANumero(validacion.valor_max),
      validacion.formato_regex,
      validacion.valores_permitidos ?? [],
      validacion.mensaje_error,
    );
  }

  private decimalANumero(valor: Prisma.Decimal | null): number | null {
    return valor === null ? null : valor.toNumber();
  }

  private aJsonEntrada(valor: unknown): Prisma.InputJsonValue {
    return valor === null
      ? (Prisma.JsonNull as unknown as Prisma.InputJsonValue)
      : (valor as Prisma.InputJsonValue);
  }

  private traducirErrorNodo(error: unknown): never {
    if (error instanceof HttpException) throw error;
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
    if (this.esErrorPrisma(error, 'P2003')) {
      if (
        detalle.includes('fk_nodo_tipo') ||
        detalle.includes('id_tipo_nodo')
      ) {
        throw new TipoNodoNoEncontradoException();
      }
      if (
        detalle.includes('fk_nodo_contenido_cronograma') ||
        detalle.includes('id_contenido_cronograma')
      ) {
        throw new ContenidoCronogramaNoEncontradoException();
      }
      throw new FlujoConversacionalNoEncontradoException();
    }
    throw error;
  }

  private traducirErrorTransicion(error: unknown): never {
    if (error instanceof HttpException) throw error;
    if (this.esErrorPrisma(error, 'P2025')) {
      throw new TransicionConversacionalNoEncontradaException();
    }
    if (this.esErrorPrisma(error, 'P2002')) {
      throw new OrdenTransicionDuplicadoException();
    }
    const detalle = this.obtenerDetalle(error);
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
        const conflictoVersion =
          this.esErrorPrisma(error, 'P2002') &&
          this.obtenerDetalle(error).includes('uq_flujo_version_personalizada');
        if (
          (!this.esErrorPrisma(error, 'P2034') && !conflictoVersion) ||
          intento === maximoIntentos
        ) {
          throw error;
        }
      }
    }

    throw new Error('No fue posible completar la transacción serializable.');
  }
}
