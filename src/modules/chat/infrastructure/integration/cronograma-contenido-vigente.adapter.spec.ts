import { ConsultaContenidoVigentePort } from '../../../cronograma/application/ports/consulta-contenido-vigente.port';
import { EstadoContenido } from '../../../cronograma/domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../../cronograma/domain/enums/tipo-contenido.enum';
import { CronogramaContenidoVigenteAdapter } from './cronograma-contenido-vigente.adapter';

describe('CronogramaContenidoVigenteAdapter', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const cronograma: jest.Mocked<ConsultaContenidoVigentePort> = {
    consultar: jest.fn(),
  };
  const adapter = new CronogramaContenidoVigenteAdapter(cronograma);
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

  it('fija CHAT como identidad del consumidor y expone solamente su contrato', async () => {
    const contenidoInterno = { ...contenido, dato_interno: 'no exponer' };
    cronograma.consultar.mockResolvedValue([contenidoInterno]);

    const respuesta = await adapter.consultar(idUsuario);
    expect(cronograma.consultar.mock.calls).toEqual([[idUsuario, 'CHAT']]);
    expect(respuesta).toEqual([contenido]);
    expect(respuesta[0]).not.toBe(contenidoInterno);
    expect(respuesta[0]).not.toHaveProperty('dato_interno');
  });

  it('conserva la ausencia de contenido vigente', async () => {
    cronograma.consultar.mockResolvedValue([]);
    await expect(adapter.consultar(idUsuario)).resolves.toEqual([]);
  });
});
