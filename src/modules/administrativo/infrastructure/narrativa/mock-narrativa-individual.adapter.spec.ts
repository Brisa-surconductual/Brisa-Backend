import {
  ID_USUARIO_INCONSISTENTE_M06,
  MockNarrativaIndividualAdapter,
} from './mock-narrativa-individual.adapter';

const ID_USUARIO = 'e0000000-0000-4000-8000-000000000003';

describe('MockNarrativaIndividualAdapter', () => {
  const adaptador = new MockNarrativaIndividualAdapter();
  const variables = [
    'SIMULAR_M6_CAIDO',
    'SIMULAR_INCONSISTENCIA_M6',
    'SIMULAR_M6_SIN_DATOS',
    'SIMULAR_M6_PROGRESION_INICIAL',
    'MOCK_M6_DELAY_MS',
  ] as const;
  const anteriores = Object.fromEntries(
    variables.map((v) => [v, process.env[v]]),
  );

  beforeEach(() => {
    for (const v of variables) delete process.env[v];
    process.env.MOCK_M6_DELAY_MS = '0';
  });

  afterAll(() => {
    for (const v of variables) {
      if (anteriores[v] === undefined) delete process.env[v];
      else process.env[v] = anteriores[v];
    }
  });

  it('devuelve la progresión de muestra del contrato para el usuario solicitado', async () => {
    await expect(
      adaptador.obtenerProgresionNarrativa(ID_USUARIO),
    ).resolves.toMatchObject({
      id_usuario: ID_USUARIO,
      id_fase_activa: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
      nombre_fase_activa: 'DESARROLLO',
      id_capitulo_completado: '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
      logros_narrativos_desbloqueados: [
        {
          id_logro: '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
          nombre_logro: 'Primer paso',
          fecha_desbloqueo: '2026-10-30T18:00:00Z',
        },
      ],
      estado_progresion_narrativa: 'ACTIVA',
    });
  });

  it('SIMULAR_M6_PROGRESION_INICIAL: sin capítulos ni logros', async () => {
    process.env.SIMULAR_M6_PROGRESION_INICIAL = 'true';
    await expect(
      adaptador.obtenerProgresionNarrativa(ID_USUARIO),
    ).resolves.toMatchObject({
      nombre_fase_activa: 'INICIO',
      id_capitulo_completado: null,
      logros_narrativos_desbloqueados: [],
      estado_progresion_narrativa: 'INICIAL',
    });
  });

  it('SIMULAR_M6_CAIDO: falla como un módulo que no responde', async () => {
    process.env.SIMULAR_M6_CAIDO = 'true';
    await expect(
      adaptador.obtenerProgresionNarrativa(ID_USUARIO),
    ).rejects.toThrow('M06 no disponible');
  });

  it('SIMULAR_INCONSISTENCIA_M6: responde por otro usuario', async () => {
    process.env.SIMULAR_INCONSISTENCIA_M6 = 'TRUE';
    await expect(
      adaptador.obtenerProgresionNarrativa(ID_USUARIO),
    ).resolves.toMatchObject({ id_usuario: ID_USUARIO_INCONSISTENTE_M06 });
  });

  it('SIMULAR_M6_SIN_DATOS: sin perfil narrativo', async () => {
    process.env.SIMULAR_M6_SIN_DATOS = 'true';
    await expect(
      adaptador.obtenerProgresionNarrativa(ID_USUARIO),
    ).resolves.toBeNull();
  });

  it('simula la latencia configurada en MOCK_M6_DELAY_MS', async () => {
    jest.useFakeTimers();
    try {
      process.env.MOCK_M6_DELAY_MS = '300';
      let resuelto = false;
      const llamada = adaptador
        .obtenerProgresionNarrativa(ID_USUARIO)
        .then(() => (resuelto = true));
      await jest.advanceTimersByTimeAsync(299);
      expect(resuelto).toBe(false);
      await jest.advanceTimersByTimeAsync(1);
      await llamada;
      expect(resuelto).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
