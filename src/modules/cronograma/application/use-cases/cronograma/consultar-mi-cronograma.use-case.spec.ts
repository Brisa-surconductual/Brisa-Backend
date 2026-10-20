import { ConsultarMiCronogramaUseCase } from './consultar-mi-cronograma.use-case';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
import { CronogramaUsuarioRepository } from '../../../domain/repositories/cronograma-usuario.repository';

describe('Consultar cronograma propio', () => {
  const buscarPorUsuario = jest.fn();
  const buscarPorId = jest.fn();
  const caso = new ConsultarMiCronogramaUseCase(
    { buscarPorUsuario } as unknown as CronogramaUsuarioRepository,
    { buscarPorId } as unknown as CronogramaRepository,
  );
  beforeEach(() => jest.resetAllMocks());
  it('consulta el asignado, aunque haya dejado de ser el base vigente', async () => {
    const fecha = new Date('2026-01-01');
    buscarPorUsuario.mockResolvedValue({
      id_cronograma: 'anterior',
      fecha_inicio_usuario: fecha,
    });
    buscarPorId.mockResolvedValue({
      id_cronograma: 'anterior',
      nombre_cronograma: 'Base anterior',
      estado: 'ACTIVO',
      es_base: false,
    });
    await expect(caso.execute('estudiante')).resolves.toEqual({
      id_cronograma: 'anterior',
      nombre: 'Base anterior',
      estado: 'ACTIVO',
      fecha_inicio_usuario: fecha,
    });
    expect(buscarPorUsuario).toHaveBeenCalledWith('estudiante');
    expect(buscarPorId).toHaveBeenCalledWith('anterior');
  });
  it('retorna 404 sin asignación', async () => {
    buscarPorUsuario.mockResolvedValue(null);
    await expect(caso.execute('estudiante')).rejects.toMatchObject({
      status: 404,
    });
    expect(buscarPorId).not.toHaveBeenCalled();
  });
});
