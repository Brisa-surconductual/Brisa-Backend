import { PublicarEventosCambioEstadoUseCase } from '../../application/use-cases/publicar-eventos-cambio-estado.use-case';
import { PublicarEventosContenidoCron } from './publicar-eventos-contenido.cron';

describe('PublicarEventosContenidoCron (RF-15)', () => {
  const resultado = {
    contenidos_revisados: 0,
    eventos_publicados: 0,
    eventos_duplicados: 0,
    cambios_invalidos: 0,
  };
  const useCase = { execute: jest.fn() };
  let cron: PublicarEventosContenidoCron;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase.execute.mockResolvedValue(resultado);
    cron = new PublicarEventosContenidoCron(
      useCase as unknown as PublicarEventosCambioEstadoUseCase,
    );
  });

  it('evita ejecuciones solapadas del job de un segundo', async () => {
    let resolver: ((value: typeof resultado) => void) | undefined;
    useCase.execute.mockReturnValue(
      new Promise<typeof resultado>((resolve) => {
        resolver = resolve;
      }),
    );

    const primera = cron.ejecutar();
    await cron.ejecutar();

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    resolver?.(resultado);
    await primera;
  });

  it('libera el bloqueo aunque una ejecución falle', async () => {
    useCase.execute
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce(resultado);

    await cron.ejecutar();
    await cron.ejecutar();

    expect(useCase.execute).toHaveBeenCalledTimes(2);
  });
});
