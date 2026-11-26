import { InicializarModalidadRegistroListener } from './inicializar-modalidad-registro.listener';
import { InicializarModalidadUsuarioUseCase } from '../../application/use-cases/modalidad/inicializar-modalidad-usuario.use-case';
import { ModalidadUsuarioYaInicializadaException } from '../../domain/exceptions';

describe('Registro de estudiante e inicialización de modalidad', () => {
  const execute = jest.fn();
  const listener = new InicializarModalidadRegistroListener({
    execute,
  } as unknown as InicializarModalidadUsuarioUseCase);

  beforeEach(() => execute.mockReset());

  it('asigna la modalidad inicial tras registrarse', async () => {
    await listener.ejecutar({ idUsuario: 'estudiante' });
    expect(execute).toHaveBeenCalledWith('estudiante');
  });

  it('no rompe el registro si no hay programa base configurado', async () => {
    execute.mockRejectedValue(new Error('sin programa base'));

    await expect(
      listener.ejecutar({ idUsuario: 'estudiante' }),
    ).resolves.toBeUndefined();
  });

  it('tolera que el estudiante ya tenga una modalidad asignada', async () => {
    execute.mockRejectedValue(new ModalidadUsuarioYaInicializadaException());

    await expect(
      listener.ejecutar({ idUsuario: 'estudiante' }),
    ).resolves.toBeUndefined();
  });
});
