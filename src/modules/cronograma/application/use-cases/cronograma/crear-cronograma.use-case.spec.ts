import { CrearCronogramaUseCase } from './crear-cronograma.use-case';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
import { Cronograma } from '../../../domain/entities/cronograma.entity';
import { EstadoCronograma } from '../../../domain/enums/estado-cronograma.enum';

describe('Creación de cronograma base', () => {
  const save = jest.fn<Promise<void>, [Cronograma]>();
  const caso = new CrearCronogramaUseCase({
    save,
  } as unknown as CronogramaRepository);
  beforeEach(() => {
    save.mockReset();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-20T15:00:00Z'));
  });
  afterEach(() => jest.useRealTimers());
  it('acepta el día de hoy y deja el base INACTIVO mientras se configura', async () => {
    await caso.execute({
      nombre: 'Base nuevo',
      es_base: true,
      fecha_activacion: new Date('2026-10-20T00:00:00Z'),
    });
    expect(save).toHaveBeenCalledTimes(1);
    const [creado] = save.mock.calls[0];
    expect(creado.estado).toBe(EstadoCronograma.INACTIVO);
    expect(creado.es_base).toBe(true);
  });
  it('acepta el día de Colombia aunque UTC ya esté en el siguiente día', async () => {
    jest.setSystemTime(new Date('2026-10-21T02:00:00Z'));
    await caso.execute({
      nombre: 'Base nuevo',
      es_base: true,
      fecha_activacion: new Date('2026-10-20T00:00:00Z'),
    });
    expect(save).toHaveBeenCalledTimes(1);
  });
  it('conserva la validación de fecha anterior', async () => {
    await expect(
      caso.execute({
        nombre: 'Base nuevo',
        es_base: true,
        fecha_activacion: new Date('2026-10-19T00:00:00Z'),
      }),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });
});
