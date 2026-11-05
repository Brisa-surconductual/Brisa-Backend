import { ConsultaContenidoVigentePort } from '../../../cronograma/application/ports/consulta-contenido-vigente.port';
import { EstadoContenido } from '../../../cronograma/domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../../cronograma/domain/enums/tipo-contenido.enum';
import { ContenidoVigenteChat } from '../../domain/entities/contenido-vigente/contenido-vigente-chat.entity';
import { CronogramaContenidoVigenteChatRepository } from './cronograma-contenido-vigente-chat.repository';

describe('CronogramaContenidoVigenteChatRepository', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const cronograma: jest.Mocked<ConsultaContenidoVigentePort> = {
    consultar: jest.fn(),
  };
  const repository = new CronogramaContenidoVigenteChatRepository(cronograma);
  const contenido = {
    id_contenido: 'contenido-1',
    id_contenido_cronograma: 'asociacion-1',
    nombre_contenido: 'Prevención',
    tipo_contenido: TipoContenido.INFORMATIVO,
    id_unidad_temporal: 'unidad-1',
    nombre_unidad: 'Semana 1',
    orden_unidad: 1,
    orden_contenido: null,
    fecha_inicio_disponibilidad: new Date('2026-10-01T00:00:00.000Z'),
    fecha_fin_disponibilidad: new Date('2026-10-15T00:00:00.000Z'),
    estado_disponibilidad: EstadoContenido.ACTIVO,
  };

  beforeEach(() => jest.clearAllMocks());

  it('fija CHAT como consumidor y devuelve entidades del dominio del chat', async () => {
    cronograma.consultar.mockResolvedValue([
      { ...contenido, dato_interno: 'no exponer' } as never,
    ]);

    const resultado = await repository.listarPorUsuario(idUsuario);

    expect(cronograma.consultar.mock.calls).toEqual([[idUsuario, 'CHAT']]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toBeInstanceOf(ContenidoVigenteChat);
    expect(resultado[0]).toMatchObject({
      idContenido: 'contenido-1',
      idContenidoCronograma: 'asociacion-1',
      nombreContenido: 'Prevención',
      ordenContenido: null,
    });
    expect(resultado[0]).not.toHaveProperty('dato_interno');
  });

  it('conserva la ausencia de contenido vigente', async () => {
    cronograma.consultar.mockResolvedValue([]);
    await expect(repository.listarPorUsuario(idUsuario)).resolves.toEqual([]);
  });
});
