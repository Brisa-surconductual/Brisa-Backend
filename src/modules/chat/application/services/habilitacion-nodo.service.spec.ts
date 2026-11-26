import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { nodoRespuesta } from '../support/testing/respuesta-fixtures';
import {
  habilitacionPrueba,
  presentadorNodoPrueba,
} from '../support/testing/presentacion-nodo.fixture';

describe('Ritmo de la terapia por cronograma (RF-24 / RF-22)', () => {
  const sesion = {
    idSesion: 's-1',
    idUsuario: 'u-1',
    estadoActual: 'ACTIVA',
  } as SesionConversacional;
  const conContenido = nodoRespuesta({
    tipo_entrada: 'NUMERICO',
    min: 0,
    max: 10,
  }).actualizar({
    contenido: {
      texto: 'Unidad 2',
      entrada: { tipo: 'NUMERICO', min: 0, max: 10 },
    },
    idContenido: 'contenido-craving',
  });
  const lecturas = {
    esTerminal: () => Promise.resolve(false),
    consultarRecursos: jest.fn().mockResolvedValue([]),
  };
  const firmar = { lectura: jest.fn() };

  it('un nodo sin contenido del cronograma está habilitado sin consultar', async () => {
    const consultar = jest.fn();
    const servicio = habilitacionPrueba();
    (
      servicio as unknown as { habilitacion: { consultar: jest.Mock } }
    ).habilitacion.consultar = consultar;

    await expect(servicio.evaluar('u-1', nodoRespuesta())).resolves.toEqual({
      habilitado: true,
      habilitaAprox: null,
    });
    expect(consultar).not.toHaveBeenCalled();
  });

  it('un nodo cuyo contenido ya empezó se presenta completo', async () => {
    const presentacion = await presentadorNodoPrueba(
      lecturas,
      firmar,
      habilitacionPrueba({ habilitado: true, fechaHabilitacion: null }),
    ).preparar(sesion, conContenido);

    expect(presentacion.nodo.disponibilidad).toEqual({
      habilitado: true,
      habilitaAprox: null,
    });
    expect(presentacion.nodo.entrada?.tipo).toBe('NUMERICO');
    expect(presentacion.nodo.bloques.length).toBeGreaterThan(0);
  });

  it('un nodo en espera no expone su contenido ni su formulario', async () => {
    lecturas.consultarRecursos.mockClear();
    const presentacion = await presentadorNodoPrueba(
      lecturas,
      firmar,
      habilitacionPrueba({
        habilitado: false,
        fechaHabilitacion: new Date('2026-12-01T12:00:00.000Z'),
      }),
    ).preparar(sesion, conContenido);

    expect(presentacion.nodo.disponibilidad).toEqual({
      habilitado: false,
      habilitaAprox: '2026-12-01T12:00:00.000Z',
    });
    expect(presentacion.nodo.bloques).toEqual([]);
    expect(presentacion.nodo.entrada).toBeNull();
    // Ni siquiera se consultan los recursos (URL firmadas) del contenido.
    expect(lecturas.consultarRecursos).not.toHaveBeenCalled();
  });

  it('si el cronograma no responde, el error se propaga (nunca habilita por defecto)', async () => {
    const servicio = habilitacionPrueba();
    (
      servicio as unknown as { habilitacion: { consultar: jest.Mock } }
    ).habilitacion.consultar = jest
      .fn()
      .mockRejectedValue(new Error('cronograma caído'));

    await expect(servicio.evaluar('u-1', conContenido)).rejects.toThrow(
      'cronograma caído',
    );
  });
});
