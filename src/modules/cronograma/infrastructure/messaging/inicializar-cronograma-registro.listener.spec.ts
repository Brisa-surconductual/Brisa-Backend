import { InicializarCronogramaRegistroListener } from './inicializar-cronograma-registro.listener';
import { InicializarCronogramaUsuarioUseCase } from '../../application/use-cases/cronograma/inicializar-cronograma-usuario.use-case';
import { CronogramaUsuarioYaInicializadoException } from '../../domain/exeption/cronograma/cronograma-usuario-ya-inicializado.exception';

describe('Registro de estudiante e inicialización', () => {
  const execute = jest.fn();
  const listener = new InicializarCronogramaRegistroListener({
    execute,
  } as unknown as InicializarCronogramaUsuarioUseCase);
  beforeEach(() => execute.mockReset());
  it('espera la asignación inmediata tras registrarse', async () => {
    await listener.ejecutar({ idUsuario: 'estudiante' });
    expect(execute).toHaveBeenCalledWith('estudiante');
  });
  it('deja recuperar al cron si no hay base y no rompe la cuenta creada', async () => {
    execute.mockRejectedValue(new Error('sin base'));
    await expect(
      listener.ejecutar({ idUsuario: 'estudiante' }),
    ).resolves.toBeUndefined();
  });
  it('tolera que el cron haya asignado antes al mismo estudiante', async () => {
    execute.mockRejectedValue(new CronogramaUsuarioYaInicializadoException());
    await expect(
      listener.ejecutar({ idUsuario: 'estudiante' }),
    ).resolves.toBeUndefined();
  });
});
