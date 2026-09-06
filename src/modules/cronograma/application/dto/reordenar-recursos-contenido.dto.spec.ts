import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReordenarRecursosContenidoDtoRequest } from './reordenar-recursos-contenido.dto-request';

describe('ReordenarRecursosContenidoDtoRequest (RF-153)', () => {
  const idRecurso = '00000000-0000-4000-8000-000000000001';

  it('acepta una lista ordenada de recursos únicos', async () => {
    const dto = plainToInstance(ReordenarRecursosContenidoDtoRequest, {
      id_recursos: [idRecurso],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([
    ['vacía', []],
    ['con duplicados', [idRecurso, idRecurso]],
    ['con identificador inválido', ['no-uuid']],
  ])('rechaza una lista %s', async (_, idRecursos) => {
    const dto = plainToInstance(ReordenarRecursosContenidoDtoRequest, {
      id_recursos: idRecursos,
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
