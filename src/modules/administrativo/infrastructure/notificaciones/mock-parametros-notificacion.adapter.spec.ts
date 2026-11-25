import type {
  FranjaHoraria,
  ParametrosNotificacionPort,
} from '../../application/ports/parametros-notificacion.port';
import { RechazoConfiguracionError } from '../../application/ports/rechazo-configuracion';
import { MockParametrosNotificacionAdapter } from './mock-parametros-notificacion.adapter';

const ACTOR = {
  id_usuario_administrativo: 'a0000000-0000-4000-8000-0000000000ad',
};

const franja = (
  segmento: FranjaHoraria['segmento'],
  hora_inicio: string,
  hora_fin: string,
  habilitada_dias_habiles = true,
  habilitada_fines_semana = true,
): FranjaHoraria => ({
  segmento,
  hora_inicio,
  hora_fin,
  habilitada_dias_habiles,
  habilitada_fines_semana,
});

const FRANJAS_POR_DEFECTO = [
  franja('MANANA', '07:00', '11:59'),
  franja('TARDE', '12:00', '17:59'),
  franja('NOCHE', '18:00', '21:59'),
];

describe('MockParametrosNotificacionAdapter (M07, RF-87/88/89)', () => {
  const variables = [
    'SIMULAR_M7_CAIDO',
    'SIMULAR_FALLO_GUARDADO_M7',
    'MOCK_M7_DELAY_MS',
  ] as const;
  const anteriores = Object.fromEntries(
    variables.map((v) => [v, process.env[v]]),
  );
  let adaptador: ParametrosNotificacionPort;

  beforeEach(() => {
    for (const v of variables) delete process.env[v];
    process.env.MOCK_M7_DELAY_MS = '0';
    adaptador = new MockParametrosNotificacionAdapter();
  });

  afterAll(() => {
    for (const v of variables) {
      if (anteriores[v] === undefined) delete process.env[v];
      else process.env[v] = anteriores[v];
    }
  });

  const rechazoDe = async (promesa: Promise<unknown>) => {
    const error = await promesa.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RechazoConfiguracionError);
    const { status, codigo, mensaje } = error as RechazoConfiguracionError;
    return { status, codigo, mensaje };
  };

  const cambiarFranjas = (franjas: unknown) =>
    adaptador.actualizarParametro(
      'FRANJAS_HORARIAS',
      franjas,
      FRANJAS_POR_DEFECTO,
      ACTOR,
    );

  it('arranca con los valores por defecto de RF-87, RF-88 y RF-89', async () => {
    await expect(adaptador.obtenerParametros()).resolves.toEqual({
      LIMITE_DIARIO: { dias_habiles: 2, fines_semana: 3 },
      INTERVALO_MINIMO: { horas: 3 },
      FRANJAS_HORARIAS: FRANJAS_POR_DEFECTO,
    });
  });

  it('persiste un cambio del límite diario', async () => {
    await expect(
      adaptador.actualizarParametro(
        'LIMITE_DIARIO',
        { dias_habiles: 1, fines_semana: 2 },
        { dias_habiles: 2, fines_semana: 3 },
        ACTOR,
      ),
    ).resolves.toMatchObject({
      valor_anterior: { dias_habiles: 2, fines_semana: 3 },
      valor_vigente: { dias_habiles: 1, fines_semana: 2 },
    });
    await expect(adaptador.obtenerParametros()).resolves.toMatchObject({
      LIMITE_DIARIO: { dias_habiles: 1, fines_semana: 2 },
    });
  });

  it.each([
    ['LIMITE_DIARIO', { dias_habiles: 0, fines_semana: 3 }],
    ['LIMITE_DIARIO', { dias_habiles: 2.5, fines_semana: 3 }],
    ['LIMITE_DIARIO', { dias_habiles: 2 }],
    ['LIMITE_DIARIO', { dias_habiles: 2, fines_semana: 3, prevencion: 1 }],
    ['INTERVALO_MINIMO', { horas: 0 }],
    ['INTERVALO_MINIMO', { horas: -1 }],
    ['INTERVALO_MINIMO', 3],
  ] as const)(
    '400 VALOR_PARAMETRO_INVALIDO para %s = %j',
    async (tipo, valor) => {
      const vigente = (await adaptador.obtenerParametros())[tipo];
      await expect(
        rechazoDe(adaptador.actualizarParametro(tipo, valor, vigente, ACTOR)),
      ).resolves.toMatchObject({
        status: 400,
        codigo: 'VALOR_PARAMETRO_INVALIDO',
      });
    },
  );

  it('acepta franjas válidas, incluida una deshabilitada', async () => {
    const nuevas = [
      franja('MANANA', '08:00', '11:00', true, false),
      franja('TARDE', '14:00', '17:00'),
      franja('NOCHE', '19:00', '21:00', false, false),
    ];
    await expect(cambiarFranjas(nuevas)).resolves.toMatchObject({
      valor_vigente: nuevas,
    });
  });

  it('400 FORMATO_HORA_INVALIDO con una hora fuera de HH:MM', async () => {
    await expect(
      rechazoDe(
        cambiarFranjas([
          franja('MANANA', '7:00', '11:59'),
          franja('TARDE', '12:00', '17:59'),
          franja('NOCHE', '18:00', '24:00'),
        ]),
      ),
    ).resolves.toMatchObject({ status: 400, codigo: 'FORMATO_HORA_INVALIDO' });
  });

  it('400 HORARIO_FRANJA_INVALIDO con el segmento en el mensaje', async () => {
    await expect(
      rechazoDe(
        cambiarFranjas([
          franja('MANANA', '07:00', '11:59'),
          franja('TARDE', '17:00', '12:00'),
          franja('NOCHE', '18:00', '21:59'),
        ]),
      ),
    ).resolves.toEqual({
      status: 400,
      codigo: 'HORARIO_FRANJA_INVALIDO',
      mensaje:
        'La hora de inicio de la franja debe ser anterior a su hora de fin. Verifique la configuración de la franja TARDE.',
    });
  });

  it('409 FRANJAS_SOLAPADAS con el mensaje del contrato', async () => {
    await expect(
      rechazoDe(
        cambiarFranjas([
          franja('MANANA', '07:00', '12:30'),
          franja('TARDE', '12:00', '17:59'),
          franja('NOCHE', '18:00', '21:59'),
        ]),
      ),
    ).resolves.toEqual({
      status: 409,
      codigo: 'FRANJAS_SOLAPADAS',
      mensaje: 'Las franjas horarias no pueden solaparse.',
    });
  });

  it.each([
    ['días hábiles', false, true],
    ['fines de semana', true, false],
  ])(
    '400 SIN_FRANJA_HABILITADA si no queda ninguna para %s',
    async (_caso, habiles, fines) => {
      await expect(
        rechazoDe(
          cambiarFranjas(
            FRANJAS_POR_DEFECTO.map((f) => ({
              ...f,
              habilitada_dias_habiles: habiles,
              habilitada_fines_semana: fines,
            })),
          ),
        ),
      ).resolves.toMatchObject({
        status: 400,
        codigo: 'SIN_FRANJA_HABILITADA',
      });
    },
  );

  it.each([
    ['falta un segmento', FRANJAS_POR_DEFECTO.slice(0, 2)],
    [
      'segmento repetido',
      [...FRANJAS_POR_DEFECTO.slice(0, 2), franja('TARDE', '18:00', '21:59')],
    ],
    [
      'segmento desconocido',
      [
        ...FRANJAS_POR_DEFECTO.slice(0, 2),
        { ...franja('NOCHE', '18:00', '21:59'), segmento: 'MADRUGADA' },
      ],
    ],
    ['no es una lista', { MANANA: '07:00' }],
  ])('400 VALOR_PARAMETRO_INVALIDO si %s', async (_caso, valor) => {
    await expect(rechazoDe(cambiarFranjas(valor))).resolves.toMatchObject({
      status: 400,
      codigo: 'VALOR_PARAMETRO_INVALIDO',
    });
  });

  it('409 CONFIGURACION_MODIFICADA si el esperado ya no es el vigente (compare-and-set)', async () => {
    await expect(
      rechazoDe(
        adaptador.actualizarParametro(
          'INTERVALO_MINIMO',
          { horas: 4 },
          { horas: 5 },
          ACTOR,
        ),
      ),
    ).resolves.toMatchObject({
      status: 409,
      codigo: 'CONFIGURACION_MODIFICADA',
    });
  });

  it('SIMULAR_FALLO_GUARDADO_M7: falla sin rechazo y conserva la configuración anterior', async () => {
    process.env.SIMULAR_FALLO_GUARDADO_M7 = 'true';
    const error = await adaptador
      .actualizarParametro(
        'INTERVALO_MINIMO',
        { horas: 4 },
        { horas: 3 },
        ACTOR,
      )
      .catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(RechazoConfiguracionError);
    await expect(adaptador.obtenerParametros()).resolves.toMatchObject({
      INTERVALO_MINIMO: { horas: 3 },
    });
  });

  it('SIMULAR_M7_CAIDO: M07 no responde', async () => {
    process.env.SIMULAR_M7_CAIDO = 'true';
    await expect(adaptador.obtenerParametros()).rejects.toThrow(
      'M07 no disponible',
    );
  });
});
