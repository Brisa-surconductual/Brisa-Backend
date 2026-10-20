import {
  ModalidadConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  ModalidadNoConfiguradaException,
  PerfilClinicoIncompletoException,
} from '../../domain/exeption/contexto-conversacional.exceptions';
import { ContextoConversacionalRepository } from '../../domain/repositories/contexto-conversacional.repository';
import { DeterminarContextoConversacionalUseCase } from './determinar-contexto-conversacional.use-case';

describe('DeterminarContextoConversacionalUseCase', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';

  const repository: jest.Mocked<ContextoConversacionalRepository> = {
    obtenerModalidadVigente: jest.fn(),
    obtenerPerfilClinico: jest.fn(),
  };

  let useCase: DeterminarContextoConversacionalUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeterminarContextoConversacionalUseCase(repository);
  });

  it('retorna modalidad GRUPAL sin consultar el perfil clínico', async () => {
    repository.obtenerModalidadVigente.mockResolvedValue(
      ModalidadConversacional.GRUPAL,
    );

    await expect(useCase.execute(idUsuario)).resolves.toEqual({
      modalidad: ModalidadConversacional.GRUPAL,
      perfil: null,
    });

    expect(repository.obtenerPerfilClinico.mock.calls).toHaveLength(0);
  });

  it('retorna modalidad PERSONALIZADA con el perfil clínico completo', async () => {
    repository.obtenerModalidadVigente.mockResolvedValue(
      ModalidadConversacional.PERSONALIZADA,
    );

    repository.obtenerPerfilClinico.mockResolvedValue({
      tipoDependencia: TipoDependenciaClinica.ABSTINENCIA_FISICA,
      tipoCraving: TipoCravingClinico.POSITIVO,
      completo: true,
    });

    await expect(useCase.execute(idUsuario)).resolves.toEqual({
      modalidad: ModalidadConversacional.PERSONALIZADA,
      perfil: {
        tipoDependencia: TipoDependenciaClinica.ABSTINENCIA_FISICA,
        tipoCraving: TipoCravingClinico.POSITIVO,
      },
    });
  });

  it('rechaza cuando el usuario no tiene modalidad configurada', async () => {
    repository.obtenerModalidadVigente.mockResolvedValue(null);

    await expect(useCase.execute(idUsuario)).rejects.toBeInstanceOf(
      ModalidadNoConfiguradaException,
    );

    expect(repository.obtenerPerfilClinico.mock.calls).toHaveLength(0);
  });

  it('rechaza modalidad PERSONALIZADA cuando el perfil está incompleto', async () => {
    repository.obtenerModalidadVigente.mockResolvedValue(
      ModalidadConversacional.PERSONALIZADA,
    );

    repository.obtenerPerfilClinico.mockResolvedValue({
      tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
      tipoCraving: null,
      completo: false,
    });

    await expect(useCase.execute(idUsuario)).rejects.toBeInstanceOf(
      PerfilClinicoIncompletoException,
    );
  });

  it('rechaza modalidad PERSONALIZADA cuando no existe perfil clínico', async () => {
    repository.obtenerModalidadVigente.mockResolvedValue(
      ModalidadConversacional.PERSONALIZADA,
    );

    repository.obtenerPerfilClinico.mockResolvedValue(null);

    await expect(useCase.execute(idUsuario)).rejects.toBeInstanceOf(
      PerfilClinicoIncompletoException,
    );
  });
});
