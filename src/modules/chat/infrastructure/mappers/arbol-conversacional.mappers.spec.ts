import { Prisma } from '@prisma/client';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { OperadorCondicion } from '../../domain/enums/operador-condicional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { TipoDatoValidacion } from '../../domain/enums/tipo-dato-validacion-enum';
import { CatalogosConversacionalesMapper } from './catalogos-conversacionales.mapper';
import { FlujoConversacionalMapper } from './flujo-conversacional.mapper';
import { NodoConversacionalMapper } from './nodo-conversacional.mapper';
import { ReglaValidacionMapper } from './regla-validacion.mapper';
import { TransicionConversacionalMapper } from './transicion-conversacional.mapper';

describe('Mappers del árbol conversacional', () => {
  const fecha = new Date('2026-10-01T12:00:00.000Z');
  const ids = {
    flujo: '00000000-0000-4000-8000-000000000001',
    nodoA: '00000000-0000-4000-8000-000000000002',
    nodoB: '00000000-0000-4000-8000-000000000003',
    tipo: '00000000-0000-4000-8000-000000000004',
    actor: '00000000-0000-4000-8000-000000000005',
    regla: '00000000-0000-4000-8000-000000000006',
    transicion: '00000000-0000-4000-8000-000000000007',
  };
  const filaFlujo = {
    id_flujo: ids.flujo,
    nombre: 'Árbol',
    modalidad: 'PERSONALIZADA',
    estado: 'PUBLICADO',
    version: 3,
    creado_por: ids.actor,
    fecha_creacion: fecha,
    fecha_publicacion: fecha,
    fecha_archivado: null,
    tipo_dependencia: 'TOLERANCIA',
    tipo_craving: 'NEGATIVO',
  } as never;
  const filaRegla = {
    id_regla_validacion: ids.regla,
    tipo_dato: 'NUMERICO',
    obligatorio: true,
    valor_min: new Prisma.Decimal('1.5'),
    valor_max: null,
    formato_regex: null,
    valores_permitidos: [],
    mensaje_error: 'Fuera de rango',
  } as never;

  it('convierte un flujo en entidad y de vuelta a datos de persistencia', () => {
    const flujo = FlujoConversacionalMapper.toDomain(filaFlujo);

    expect(flujo).toMatchObject({
      idFlujo: ids.flujo,
      modalidad: ModalidadConversacional.PERSONALIZADA,
      estado: EstadoFlujoConversacional.PUBLICADO,
      version: 3,
      tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
      tipoCraving: TipoCravingClinico.NEGATIVO,
    });
    expect(FlujoConversacionalMapper.toCreateData(flujo)).toMatchObject({
      id_flujo: ids.flujo,
      modalidad: 'PERSONALIZADA',
      estado: 'PUBLICADO',
      tipo_dependencia: 'TOLERANCIA',
      fecha_publicacion: fecha,
    });
    expect(FlujoConversacionalMapper.toUpdateData(flujo)).toEqual({
      nombre: 'Árbol',
      estado: 'PUBLICADO',
      fecha_publicacion: fecha,
      fecha_archivado: null,
    });
  });

  it('convierte un nodo con el nombre de su tipo', () => {
    const nodo = NodoConversacionalMapper.toDomain({
      id_nodo: ids.nodoA,
      id_flujo: ids.flujo,
      id_tipo_nodo: ids.tipo,
      contenido: { texto: 'Hola' },
      es_nodo_inicial: true,
      orden: 1,
      id_contenido_cronograma: null,
      creado_por: ids.actor,
      fecha_creacion: fecha,
      fecha_actualizacion: fecha,
      tipo_nodo: { nombre: 'MENSAJE' },
    });

    expect(nodo).toMatchObject({
      idNodo: ids.nodoA,
      nombreTipoNodo: 'MENSAJE',
      esNodoInicial: true,
    });
    expect(NodoConversacionalMapper.toCreateData(nodo)).toMatchObject({
      id_nodo: ids.nodoA,
      id_tipo_nodo: ids.tipo,
      contenido: { texto: 'Hola' },
    });
    expect(NodoConversacionalMapper.toUpdateData(nodo)).not.toHaveProperty(
      'id_nodo',
    );
  });

  it('convierte los límites decimales de la regla a número', () => {
    const regla = ReglaValidacionMapper.toDomain(filaRegla);

    expect(regla).toMatchObject({
      tipoDato: TipoDatoValidacion.NUMERICO,
      valorMin: 1.5,
      valorMax: null,
    });
    expect(ReglaValidacionMapper.toData(regla)).toMatchObject({
      id_regla_validacion: ids.regla,
      valor_min: 1.5,
      valor_max: null,
    });
  });

  it('convierte una transición con su regla y conserva el null de la condición', () => {
    const transicion = TransicionConversacionalMapper.toDomain({
      id_regla: ids.transicion,
      id_flujo: ids.flujo,
      id_nodo_origen: ids.nodoA,
      id_nodo_destino: ids.nodoB,
      id_regla_validacion: ids.regla,
      operador_condicion: 'IGUALDAD',
      valor_condicion: { valor: 'si' },
      orden_evaluacion: 1,
      fecha_creacion: fecha,
      reglas_validaciones: filaRegla,
    } as never);

    expect(transicion).toMatchObject({
      idTransicion: ids.transicion,
      operadorCondicion: OperadorCondicion.IGUALDAD,
      reglaValidacion: { idReglaValidacion: ids.regla },
    });
    expect(
      TransicionConversacionalMapper.toCreateData(transicion),
    ).toMatchObject({
      id_regla: ids.transicion,
      id_regla_validacion: ids.regla,
      valor_condicion: { valor: 'si' },
    });
    expect(
      TransicionConversacionalMapper.toUpdateData(
        transicion.actualizar({ valorCondicion: null }),
      ).valor_condicion,
    ).toBe(Prisma.JsonNull);
  });

  it('convierte los catálogos y la auditoría (identificador bigint)', () => {
    expect(
      CatalogosConversacionalesMapper.tipoNodoToDomain({
        id_tipo_nodo: ids.tipo,
        nombre: 'MENSAJE',
      }),
    ).toMatchObject({ idTipoNodo: ids.tipo, nombre: 'MENSAJE' });
    expect(
      CatalogosConversacionalesMapper.tipoEntradaToDomain({
        id_tipo_entrada: 'e-1',
        nombre: 'TEXTO_LIBRE',
      }),
    ).toMatchObject({ idTipoEntrada: 'e-1' });
    expect(
      CatalogosConversacionalesMapper.auditoriaToDomain(
        {
          id_auditoria: 9,
          id_actor: ids.actor,
          accion: 'PUBLICAR',
          id_objeto: null,
          fecha_operacion: fecha,
        } as never,
        ids.flujo,
      ).idAuditoria,
    ).toBe(9n);
  });
});
