import { BadRequestException } from '@nestjs/common';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../../domain/enums/perfil-clinico.enum';
import { PerfilClinicoArbolInvalidoException } from '../../../domain/exceptions';
import { PersistenciaArbolConversacionalException } from '../../exceptions/persistencia-arbol-conversacional.exception';
import { ids, repositorioSimulado } from '../../support/testing/arbol-fixtures';
import { CrearFlujoConversacionalUseCase } from './crear-flujo-conversacional.use-case';

describe('CrearFlujoConversacionalUseCase (RF-25 / RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new CrearFlujoConversacionalUseCase(repository);

  beforeEach(() => jest.resetAllMocks());

  it('crea un flujo grupal en borrador, versión 1, con el actor autenticado', async () => {
    const respuesta = await useCase.execute(
      { nombre: '  Árbol grupal  ', modalidad: ModalidadConversacional.GRUPAL },
      ids.actor,
    );

    const [guardado, actor] = repository.guardarFlujo.mock.calls[0];
    expect(guardado).toMatchObject({
      nombre: 'Árbol grupal',
      version: 1,
      estado: EstadoFlujoConversacional.BORRADOR,
      creadoPor: ids.actor,
    });
    expect(actor).toBe(ids.actor);
    expect(respuesta.id_flujo).toBe(guardado.idFlujo);
  });

  it('asigna al personalizado la siguiente versión de su combinación', async () => {
    repository.obtenerUltimaVersionPersonalizada.mockResolvedValue(4);

    await useCase.execute(
      {
        nombre: 'Personalizado',
        modalidad: ModalidadConversacional.PERSONALIZADA,
        tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
        tipo_craving: TipoCravingClinico.NEGATIVO,
      },
      ids.actor,
    );

    expect(repository.guardarFlujo.mock.calls[0][0]).toMatchObject({
      version: 5,
      tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
      tipoCraving: TipoCravingClinico.NEGATIVO,
    });
  });

  it('rechaza el perfil clínico en un flujo grupal', async () => {
    await expect(
      useCase.execute(
        {
          nombre: 'Grupal',
          modalidad: ModalidadConversacional.GRUPAL,
          tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
        },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.guardarFlujo).not.toHaveBeenCalled();
  });

  it('exige una combinación válida de perfil clínico (422)', async () => {
    await expect(
      useCase.execute(
        {
          nombre: 'Personalizado',
          modalidad: ModalidadConversacional.PERSONALIZADA,
          tipo_dependencia: 'OTRA' as TipoDependenciaClinica,
          tipo_craving: TipoCravingClinico.NEGATIVO,
        },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(PerfilClinicoArbolInvalidoException);
  });

  it('oculta el detalle de un error de persistencia', async () => {
    repository.guardarFlujo.mockRejectedValue(new Error('password failed'));

    await expect(
      useCase.execute(
        { nombre: 'Grupal', modalidad: ModalidadConversacional.GRUPAL },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(PersistenciaArbolConversacionalException);
  });
});
