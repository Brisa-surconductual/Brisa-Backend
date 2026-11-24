import { FlujoConversacional } from '../../domain/entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import { RegistroTrazabilidad } from '../../domain/repositories/historial-interacciones.repository';
import {
  DescribirContenidoHistoricoService,
  MotivoContenidoNoVerificable as Motivo,
  etiquetaRespuestaHistorica,
} from './describir-contenido-historico.service';
import { PrepararEntradaNodoActualService } from './preparar-entrada-nodo-actual.service';

const idFlujo = '00000000-0000-4000-8000-0000000000f1';
const otroFlujo = '00000000-0000-4000-8000-0000000000f2';
const nodoA = '00000000-0000-4000-8000-00000000000a';
const nodoB = '00000000-0000-4000-8000-00000000000b';
const publicacion = new Date('2026-11-01T00:00:00.000Z');
const antes = new Date('2026-10-30T00:00:00.000Z');
const despues = new Date('2026-11-05T00:00:00.000Z');

const sesion = (version = 2) =>
  new SesionConversacional(
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    idFlujo,
    version,
    ModalidadConversacional.GRUPAL,
    null,
    null,
    nodoB,
    'COMPLETADA',
    antes,
    despues,
  );

const flujo = (
  estado = EstadoFlujoConversacional.PUBLICADO,
  version = 2,
  fechaPublicacion: Date | null = publicacion,
) =>
  new FlujoConversacional(
    idFlujo,
    'Flujo grupal',
    ModalidadConversacional.GRUPAL,
    estado,
    version,
    'admin',
    antes,
    fechaPublicacion,
  );

const nodo = (
  id: string,
  contenido: Record<string, unknown>,
  cambios: {
    flujo?: string;
    actualizado?: Date;
    idContenido?: string | null;
    tipo?: string;
  } = {},
) =>
  new NodoConversacional(
    id,
    cambios.flujo ?? idFlujo,
    'tipo-1',
    cambios.tipo ?? 'PREGUNTA',
    contenido,
    false,
    1,
    cambios.idContenido ?? null,
    'admin',
    antes,
    cambios.actualizado ?? antes,
  );

const registro = (
  idNodo: string,
  valor: unknown = 'si',
): RegistroTrazabilidad => ({
  idInteraccion: `i-${idNodo}`,
  secuencia: 1,
  timestampInteraccion: despues,
  idNodo,
  idNodoDestino: null,
  tipoEntrada: 'OPCION_UNICA',
  valor,
});

const PREGUNTA = {
  texto: '¿Cómo te sientes hoy?',
  entrada: {
    tipo: 'OPCION_UNICA',
    opciones: [
      { valor: 'si', etiqueta: 'Bien' },
      { valor: 'no', etiqueta: 'Mal' },
    ],
  },
};

describe('DescribirContenidoHistoricoService (RF-38)', () => {
  let arboles: jest.Mocked<
    Pick<ArbolConversacionalRepository, 'buscarNodosPorIds' | 'obtenerFlujo'>
  >;
  let servicio: DescribirContenidoHistoricoService;

  beforeEach(() => {
    arboles = {
      buscarNodosPorIds: jest.fn().mockResolvedValue([nodo(nodoA, PREGUNTA)]),
      obtenerFlujo: jest.fn().mockResolvedValue(flujo()),
    };
    servicio = new DescribirContenidoHistoricoService(
      arboles as unknown as ArbolConversacionalRepository,
      new PrepararEntradaNodoActualService(),
    );
  });

  it('describe el nodo de la versión publicada de la sesión', async () => {
    const r = await servicio.describir(sesion(), [registro(nodoA)]);

    expect(r.get(nodoA)).toEqual({
      verificable: true,
      tipoNodo: 'PREGUNTA',
      texto: '¿Cómo te sientes hoy?',
      opciones: [
        { valor: 'si', etiqueta: 'Bien' },
        { valor: 'no', etiqueta: 'Mal' },
      ],
    });
  });

  it('carga todos los nodos en una sola consulta y el flujo una vez (sin N+1)', async () => {
    arboles.buscarNodosPorIds.mockResolvedValue([
      nodo(nodoA, PREGUNTA),
      nodo(nodoB, { texto: 'Gracias' }),
    ]);

    await servicio.describir(sesion(), [
      registro(nodoA),
      registro(nodoB),
      registro(nodoA),
    ]);

    expect(arboles.buscarNodosPorIds).toHaveBeenCalledTimes(1);
    expect(arboles.buscarNodosPorIds).toHaveBeenCalledWith([nodoA, nodoB]);
    expect(arboles.obtenerFlujo).toHaveBeenCalledTimes(1);
    expect(arboles.obtenerFlujo).toHaveBeenCalledWith(idFlujo);
  });

  it('sin registros no consulta nada', async () => {
    expect((await servicio.describir(sesion(), [])).size).toBe(0);
    expect(arboles.buscarNodosPorIds).not.toHaveBeenCalled();
  });

  it('un archivado también es verificable: ya no se puede editar', async () => {
    arboles.obtenerFlujo.mockResolvedValue(
      flujo(EstadoFlujoConversacional.ARCHIVADO),
    );

    expect(
      (await servicio.describir(sesion(), [registro(nodoA)])).get(nodoA),
    ).toMatchObject({
      verificable: true,
    });
  });

  it.each([
    [
      'la versión del flujo no es la de la sesión',
      () => flujo(EstadoFlujoConversacional.PUBLICADO, 3),
    ],
    [
      'el flujo sigue en borrador',
      () => flujo(EstadoFlujoConversacional.BORRADOR),
    ],
    [
      'el flujo no tiene fecha de publicación',
      () => flujo(EstadoFlujoConversacional.PUBLICADO, 2, null),
    ],
    ['el flujo no existe', () => null],
  ])('no verificable si %s', async (_, flujoDe) => {
    arboles.obtenerFlujo.mockResolvedValue(flujoDe());

    expect(
      (await servicio.describir(sesion(), [registro(nodoA)])).get(nodoA),
    ).toEqual({
      verificable: false,
      motivo: Motivo.VERSION_NO_PUBLICADA,
    });
  });

  it('no verificable si el nodo se modificó después de publicarse', async () => {
    arboles.buscarNodosPorIds.mockResolvedValue([
      nodo(nodoA, PREGUNTA, { actualizado: despues }),
    ]);

    expect(
      (await servicio.describir(sesion(), [registro(nodoA)])).get(nodoA),
    ).toEqual({
      verificable: false,
      motivo: Motivo.NODO_MODIFICADO_TRAS_PUBLICACION,
    });
  });

  it('no verificable si el nodo no pertenece al flujo de la sesión', async () => {
    arboles.buscarNodosPorIds.mockResolvedValue([
      nodo(nodoA, PREGUNTA, { flujo: otroFlujo }),
    ]);

    expect(
      (await servicio.describir(sesion(), [registro(nodoA)])).get(nodoA),
    ).toMatchObject({
      motivo: Motivo.NODO_FUERA_DE_VERSION,
    });
  });

  it('no verificable si el nodo ya no existe', async () => {
    arboles.buscarNodosPorIds.mockResolvedValue([]);

    expect(
      (await servicio.describir(sesion(), [registro(nodoA)])).get(nodoA),
    ).toMatchObject({
      motivo: Motivo.NODO_NO_DISPONIBLE,
    });
  });

  it('no presenta texto de un contenido externo sin versionar (RF-152)', async () => {
    arboles.buscarNodosPorIds.mockResolvedValue([
      nodo(
        nodoA,
        { entrada: PREGUNTA.entrada },
        { idContenido: 'contenido-1' },
      ),
    ]);

    expect(
      (await servicio.describir(sesion(), [registro(nodoA)])).get(nodoA),
    ).toEqual({
      verificable: false,
      motivo: Motivo.CONTENIDO_EXTERNO_NO_VERSIONADO,
    });
  });

  it('un nodo con contenido externo pero bloques propios usa solo sus bloques', async () => {
    arboles.buscarNodosPorIds.mockResolvedValue([
      nodo(
        nodoA,
        { bloques: [{ tipo: 'TEXTO', texto: 'Texto propio' }] },
        { idContenido: 'contenido-1' },
      ),
    ]);

    expect(
      (await servicio.describir(sesion(), [registro(nodoA)])).get(nodoA),
    ).toMatchObject({
      verificable: true,
      texto: 'Texto propio',
    });
  });

  it('no verificable si el contenido guardado no se puede interpretar', async () => {
    arboles.buscarNodosPorIds.mockResolvedValue([
      nodo(nodoA, { bloques: 'no-es-lista' }),
    ]);

    expect(
      (await servicio.describir(sesion(), [registro(nodoA)])).get(nodoA),
    ).toMatchObject({
      motivo: Motivo.CONTENIDO_NO_INTERPRETABLE,
    });
  });

  it('un nodo verificable sin texto devuelve texto null y une varios textos', async () => {
    arboles.buscarNodosPorIds.mockResolvedValue([
      nodo(nodoA, {
        multimedia: [{ tipo: 'IMAGEN', url: 'https://ejemplo.org/a.png' }],
      }),
      nodo(nodoB, { texto: 'Lee esto', instrucciones: 'Respira' }),
    ]);

    const r = await servicio.describir(sesion(), [
      registro(nodoA),
      registro(nodoB),
    ]);

    expect(r.get(nodoA)).toMatchObject({ verificable: true, texto: null });
    expect(r.get(nodoB)).toMatchObject({ texto: 'Lee esto\n\nRespira' });
  });
});

describe('etiquetaRespuestaHistorica (RF-38)', () => {
  const opciones = [
    { valor: 'a', etiqueta: 'Opción A' },
    { valor: 'b', etiqueta: 'Opción B' },
  ];

  it('opción única y su alias histórico', () => {
    expect(etiquetaRespuestaHistorica('OPCION_UNICA', 'b', opciones)).toBe(
      'Opción B',
    );
    expect(etiquetaRespuestaHistorica('SELECCION_UNICA', 'a', opciones)).toBe(
      'Opción A',
    );
  });

  it('multiselección: todas las etiquetas o ninguna', () => {
    expect(
      etiquetaRespuestaHistorica('MULTISELECCION', ['a', 'b'], opciones),
    ).toEqual(['Opción A', 'Opción B']);
    expect(
      etiquetaRespuestaHistorica('MULTISELECCION', ['a', 'z'], opciones),
    ).toBeNull();
  });

  it('sin etiqueta disponible, valor no textual u otro tipo: null', () => {
    expect(
      etiquetaRespuestaHistorica('OPCION_UNICA', 'z', opciones),
    ).toBeNull();
    expect(etiquetaRespuestaHistorica('OPCION_UNICA', 1, opciones)).toBeNull();
    expect(etiquetaRespuestaHistorica('ESCALA', 7, opciones)).toBeNull();
    expect(etiquetaRespuestaHistorica('CONTINUAR', null, opciones)).toBeNull();
    expect(etiquetaRespuestaHistorica('OPCION_UNICA', 'a', null)).toBeNull();
  });
});
