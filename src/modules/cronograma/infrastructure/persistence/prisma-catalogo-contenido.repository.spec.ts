import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaCatalogoContenidoRepository } from './prisma-catalogo-contenido.repository';
describe('Catálogo con preparación y bloqueo de edición', () => {
  const findMany = jest.fn();
  const repository = new PrismaCatalogoContenidoRepository({
    contenidos: { findMany },
  } as unknown as PrismaService);
  const registro = {
    id_contenido: 'contenido',
    nombre_contenido: 'Contenido',
    tipo_contenido: 'INFORMATIVO',
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
    contenidos_cronograma: null,
    recursos_contenido: [],
  };
  it('marca sin recursos como pendiente y conserva edición', async () => {
    findMany.mockResolvedValue([registro]);
    const [item] = await repository.listar();
    expect(item.recursosListos).toBe(false);
    expect(item.cantidadRecursos).toBe(0);
    expect(item.estadoCronograma).toBeNull();
  });
  it('expone el cronograma activo y solo considera módulos activos', async () => {
    findMany.mockResolvedValue([
      {
        ...registro,
        contenidos_cronograma: {
          id_contenido_cronograma: 'asociacion',
          unidades_temporales: { cronogramas: { estado: 'ACTIVO' } },
        },
        recursos_contenido: [
          {
            recursos_modulos_destino: [{ modulos_sistema: { activo: false } }],
          },
        ],
      },
    ]);
    const [item] = await repository.listar();
    expect(item.estadoCronograma).toBe('ACTIVO');
    expect(item.recursosListos).toBe(false);
  });
});
