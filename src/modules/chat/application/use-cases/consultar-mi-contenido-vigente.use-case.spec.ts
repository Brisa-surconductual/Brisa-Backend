import { NotFoundException } from '@nestjs/common';
import { ConsultaContenidoVigenteChatException } from '../../domain/exeption/consulta-contenido-vigente-chat.exception';
import { ContenidoVigenteChatPort } from '../ports/contenido-vigente-chat.port';
import { ConsultarMiContenidoVigenteUseCase } from './consultar-mi-contenido-vigente.use-case';

describe('ConsultarMiContenidoVigenteUseCase', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const port: jest.Mocked<ContenidoVigenteChatPort> = { consultar: jest.fn() };
  const useCase = new ConsultarMiContenidoVigenteUseCase(port);

  beforeEach(() => jest.clearAllMocks());

  it('delega solamente el usuario obtenido de la sesión', async () => {
    port.consultar.mockResolvedValue([]);
    await expect(useCase.execute(idUsuario)).resolves.toEqual([]);
    expect(port.consultar.mock.calls).toEqual([[idUsuario]]);
  });

  it('conserva los errores HTTP del proveedor', async () => {
    const error = new NotFoundException('Sin cronograma');
    port.consultar.mockRejectedValue(error);
    await expect(useCase.execute(idUsuario)).rejects.toBe(error);
  });

  it('no expone detalles de fallos inesperados de integración', async () => {
    port.consultar.mockRejectedValue(
      new Error('password authentication failed'),
    );
    await expect(useCase.execute(idUsuario)).rejects.toBeInstanceOf(
      ConsultaContenidoVigenteChatException,
    );
  });
});
