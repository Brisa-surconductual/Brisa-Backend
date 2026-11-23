import { FlujoConversacional } from '../../../domain/entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { SesionConversacionalNoEncontradaException } from '../../../domain/exceptions/sesion.exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import {
  HistorialInteraccionesRepository,
  RegistroTrazabilidad,
} from '../../../domain/repositories/historial-interacciones.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { HistorialConversacionalInconsistenteException } from '../../exceptions/historial-conversacional-inconsistente.exception';
import { SeudonimoParticipantePort } from '../../ports/seudonimo-participante.port';
import { DescribirContenidoHistoricoService } from '../../services/describir-contenido-historico.service';
import { PrepararEntradaNodoActualService } from '../../services/preparar-entrada-nodo-actual.service';
import { ConsultarTrazabilidadSesionUseCase } from './consultar-trazabilidad-sesion.use-case';

const idSesion = '00000000-0000-4000-8000-000000000001';
const idUsuario = '00000000-0000-4000-8000-000000000002';
const otroUsuario = '00000000-0000-4000-8000-000000000009';
const idFlujo = '00000000-0000-4000-8000-000000000003';
const nodoA = '00000000-0000-4000-8000-00000000000a';
const nodoB = '00000000-0000-4000-8000-00000000000b';
const nodoFin = '00000000-0000-4000-8000-00000000000f';
const publicado = new Date('2026-11-01T00:00:00.000Z');
const creado = new Date('2026-10-30T00:00:00.000Z');
const t1 = new Date('2026-11-20T14:00:00.000Z');
const t2 = new Date('2026-11-20T14:01:00.000Z');

const nodo = (id: string, contenido: Record<string, unknown>, tipo: string) =>
  new NodoConversacional(
    id,
    idFlujo,
    'tipo',
    tipo,
    contenido,
    false,
    1,
    null,
    'admin',
    creado,
    creado,
  );

const registros = (): RegistroTrazabilidad[] => [
  {
    idInteraccion: 'i1',
    secuencia: 1,
    timestampInteraccion: t1,
    idNodo: nodoA,
    idNodoDestino: nodoB,
    tipoEntrada: 'SELECCION_UNICA',
    valor: 'si',
  },
  {
    idInteraccion: 'i2',
    secuencia: 2,
    timestampInteraccion: t2,
    idNodo: nodoB,
    idNodoDestino: null,
    tipoEntrada: 'CONTINUAR',
    valor: null,
  },
];

describe('ConsultarTrazabilidadSesionUseCase', () => {
  let sesiones: jest.Mocked<
    Pick<SesionConversacionalRepository, 'buscarPorId'>
  >;
  let historial: jest.Mocked<
    Pick<HistorialInteraccionesRepository, 'consultarCompleta'>
  >;
  let arboles: jest.Mocked<
    Pick<ArbolConversacionalRepository, 'buscarNodosPorIds' | 'obtenerFlujo'>
  >;
  const obtenerSeudonimo = jest.fn<Promise<string>, [string]>();
  const resolverSeudonimo = jest.fn<Promise<string | null>, [string]>();
  let useCase: ConsultarTrazabilidadSesionUseCase;

  beforeEach(() => {
    sesiones = {
      buscarPorId: jest
        .fn()
        .mockResolvedValue(
          new SesionConversacional(
            idSesion,
            idUsuario,
            idFlujo,
            1,
            ModalidadConversacional.GRUPAL,
            null,
            null,
            nodoFin,
            'COMPLETADA',
            t1,
            t2,
          ),
        ),
    };
    historial = { consultarCompleta: jest.fn().mockResolvedValue(registros()) };
    arboles = {
      buscarNodosPorIds: jest.fn().mockResolvedValue([
        nodo(
          nodoA,
          {
            texto: '¿Dormiste bien?',
            entrada: {
              tipo: 'OPCION_UNICA',
              opciones: [{ valor: 'si', etiqueta: 'Sí, bien' }],
            },
          },
          'PREGUNTA',
        ),
        nodo(nodoB, { texto: 'Gracias por responder.' }, 'MENSAJE'),
      ]),
      obtenerFlujo: jest
        .fn()
        .mockResolvedValue(
          new FlujoConversacional(
            idFlujo,
            'Flujo',
            ModalidadConversacional.GRUPAL,
            EstadoFlujoConversacional.PUBLICADO,
            1,
            'admin',
            creado,
            publicado,
          ),
        ),
    };
    obtenerSeudonimo.mockReset().mockResolvedValue('P-1A2B3C4D');
    resolverSeudonimo.mockReset().mockResolvedValue(idUsuario);
    const seudonimos: SeudonimoParticipantePort = {
      obtener: obtenerSeudonimo,
      resolver: resolverSeudonimo,
    };
    useCase = new ConsultarTrazabilidadSesionUseCase(
      sesiones as unknown as SesionConversacionalRepository,
      historial as unknown as HistorialInteraccionesRepository,
      seudonimos,
      new DescribirContenidoHistoricoService(
        arboles as unknown as ArbolConversacionalRepository,
        new PrepararEntradaNodoActualService(),
      ),
    );
  });

  it('conserva los campos anteriores y añade el contenido histórico verificado', async () => {
    const r = await useCase.obtenerSesion(idSesion.toUpperCase());

    expect(sesiones.buscarPorId).toHaveBeenCalledWith(idSesion);
    expect(historial.consultarCompleta).toHaveBeenCalledWith(idSesion);
    expect(obtenerSeudonimo).toHaveBeenCalledWith(idUsuario);
    expect(r).toEqual({
      id_sesion: idSesion,
      id_participante: 'P-1A2B3C4D',
      registros: [
        {
          secuencia: 1,
          id_nodo: nodoA,
          respuesta_usuario: { valor: 'si' },
          id_nodo_destino: nodoB,
          timestamp_interaccion: '2026-11-20T14:00:00.000Z',
          tipo_entrada: 'OPCION_UNICA',
          contenido_historico: 'VERIFICADO',
          motivo_no_verificable: null,
          tipo_nodo: 'PREGUNTA',
          texto_nodo: '¿Dormiste bien?',
          etiqueta_respuesta: 'Sí, bien',
        },
        {
          secuencia: 2,
          id_nodo: nodoB,
          respuesta_usuario: { valor: null },
          id_nodo_destino: null,
          timestamp_interaccion: '2026-11-20T14:01:00.000Z',
          tipo_entrada: 'CONTINUAR',
          contenido_historico: 'VERIFICADO',
          motivo_no_verificable: null,
          tipo_nodo: 'MENSAJE',
          texto_nodo: 'Gracias por responder.',
          etiqueta_respuesta: null,
        },
      ],
    });
  });

  it('sin garantía histórica: campos descriptivos nulos y motivo explícito', async () => {
    arboles.obtenerFlujo.mockResolvedValue(null);

    const r = await useCase.execute(idSesion);

    for (const registro of r.registros) {
      expect(registro).toMatchObject({
        contenido_historico: 'NO_VERIFICABLE',
        motivo_no_verificable: 'VERSION_NO_PUBLICADA',
        tipo_nodo: null,
        texto_nodo: null,
        etiqueta_respuesta: null,
      });
    }
    // La trazabilidad técnica no cambia.
    expect(r.registros.map((x) => x.respuesta_usuario)).toEqual([
      { valor: 'si' },
      { valor: null },
    ]);
    expect(r.registros[0].tipo_entrada).toBe('OPCION_UNICA');
  });

  it('conserva sin modificar respuestas escalares y estructuradas', async () => {
    const valores: unknown[] = [
      7,
      true,
      'texto libre',
      ['a', 'b'],
      { hora: '08:00' },
    ];
    historial.consultarCompleta.mockResolvedValue(
      valores.map((valor, i) => ({
        idInteraccion: `i${i}`,
        secuencia: i + 1,
        timestampInteraccion: t1,
        idNodo: nodoA,
        idNodoDestino: nodoB,
        tipoEntrada: 'TEXTO_LIBRE',
        valor,
      })),
    );

    const r = await useCase.execute(idSesion);

    expect(r.registros.map((x) => x.respuesta_usuario.valor)).toEqual(valores);
    expect(r.registros.map((x) => x.secuencia)).toEqual([1, 2, 3, 4, 5]);
  });

  it('una sesión sin interacciones devuelve registros vacíos', async () => {
    historial.consultarCompleta.mockResolvedValue([]);

    const r = await useCase.execute(idSesion);

    expect(r.registros).toEqual([]);
    expect(arboles.buscarNodosPorIds).not.toHaveBeenCalled();
  });

  it('404 si la sesión no existe, sin crear seudónimo', async () => {
    sesiones.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(idSesion)).rejects.toBeInstanceOf(
      SesionConversacionalNoEncontradaException,
    );
    expect(obtenerSeudonimo).not.toHaveBeenCalled();
  });

  it('422 HISTORIAL_INCONSISTENTE si la integridad falla', async () => {
    historial.consultarCompleta.mockResolvedValue(null);

    await expect(useCase.execute(idSesion)).rejects.toBeInstanceOf(
      HistorialConversacionalInconsistenteException,
    );
    expect(obtenerSeudonimo).not.toHaveBeenCalled();
  });

  it('con codigo_participante del dueño: responde con normalidad', async () => {
    const r = await useCase.execute(idSesion, {
      codigoParticipante: 'P-1A2B3C4D',
    });

    expect(resolverSeudonimo).toHaveBeenCalledWith('P-1A2B3C4D');
    expect(r.id_participante).toBe('P-1A2B3C4D');
  });

  it.each([
    ['de otro participante', otroUsuario],
    ['inexistente', null],
  ])(
    'con codigo_participante %s: 404, sin leer el historial',
    async (_, dueno) => {
      resolverSeudonimo.mockResolvedValue(dueno);

      await expect(
        useCase.execute(idSesion, { codigoParticipante: 'P-FFFFFFFF' }),
      ).rejects.toBeInstanceOf(SesionConversacionalNoEncontradaException);
      expect(historial.consultarCompleta).not.toHaveBeenCalled();
      expect(obtenerSeudonimo).not.toHaveBeenCalled();
    },
  );

  it('solo lee: no usa ninguna operación de escritura de sesiones ni del historial', async () => {
    const accesos: string[] = [];
    const soloLectura = <T extends object>(objeto: T, permitidos: string[]) =>
      new Proxy(objeto, {
        get(destino, propiedad) {
          accesos.push(String(propiedad));
          if (typeof propiedad === 'string' && !permitidos.includes(propiedad))
            throw new Error(`Acceso no permitido: ${propiedad}`);
          return Reflect.get(destino, propiedad) as unknown;
        },
      });
    const seudonimos: SeudonimoParticipantePort = {
      obtener: obtenerSeudonimo,
      resolver: resolverSeudonimo,
    };
    const lectura = new ConsultarTrazabilidadSesionUseCase(
      soloLectura(sesiones, [
        'buscarPorId',
      ]) as unknown as SesionConversacionalRepository,
      soloLectura(historial, [
        'consultarCompleta',
      ]) as unknown as HistorialInteraccionesRepository,
      seudonimos,
      new DescribirContenidoHistoricoService(
        soloLectura(arboles, [
          'buscarNodosPorIds',
          'obtenerFlujo',
        ]) as unknown as ArbolConversacionalRepository,
        new PrepararEntradaNodoActualService(),
      ),
    );

    await expect(lectura.execute(idSesion)).resolves.toBeDefined();
    expect(new Set(accesos)).toEqual(
      new Set([
        'buscarPorId',
        'consultarCompleta',
        'buscarNodosPorIds',
        'obtenerFlujo',
      ]),
    );
  });
});
