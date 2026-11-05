import { NotFoundException } from '@nestjs/common';
import { ContenidoVigenteChat } from '../../../domain/entities/contenido-vigente/contenido-vigente-chat.entity';
import { ContenidoVigenteChatRepository } from '../../../domain/repositories/contenido-vigente-chat.repository';
import { ConsultaContenidoVigenteChatException } from '../../exceptions/consulta-contenido-vigente-chat.exception';
import { ConsultarMiContenidoVigenteUseCase } from './consultar-mi-contenido-vigente.use-case';

describe('ConsultarMiContenidoVigenteUseCase', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const repository: jest.Mocked<ContenidoVigenteChatRepository> = {
    listarPorUsuario: jest.fn(),
  };
  const useCase = new ConsultarMiContenidoVigenteUseCase(repository);

  beforeEach(() => jest.clearAllMocks());

  it('consulta solo por el usuario de la sesión y responde con el contrato HTTP', async () => {
    repository.listarPorUsuario.mockResolvedValue([
      new ContenidoVigenteChat(
        'c-1',
        'cc-1',
        'Prevención',
        'INFORMATIVO',
        'u-1',
        'Semana 1',
        1,
        null,
        new Date('2026-10-01T00:00:00.000Z'),
        new Date('2026-10-15T00:00:00.000Z'),
        'ACTIVO',
      ),
    ]);

    const respuesta = await useCase.execute(idUsuario);

    expect(repository.listarPorUsuario.mock.calls).toEqual([[idUsuario]]);
    expect(respuesta).toEqual([
      expect.objectContaining({
        id_contenido: 'c-1',
        id_contenido_cronograma: 'cc-1',
        nombre_contenido: 'Prevención',
        orden_contenido: null,
      }),
    ]);
  });

  it('conserva los errores HTTP del proveedor', async () => {
    const error = new NotFoundException('Sin cronograma');
    repository.listarPorUsuario.mockRejectedValue(error);
    await expect(useCase.execute(idUsuario)).rejects.toBe(error);
  });

  it('no expone detalles de fallos inesperados de integración', async () => {
    repository.listarPorUsuario.mockRejectedValue(
      new Error('password authentication failed'),
    );
    await expect(useCase.execute(idUsuario)).rejects.toBeInstanceOf(
      ConsultaContenidoVigenteChatException,
    );
  });
});
