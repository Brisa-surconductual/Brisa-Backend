import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaSesionConversacionalRepository } from './prisma-sesion-conversacional.repository';

describe('PrismaSesionConversacionalRepository', () => {
  const findFirst = jest.fn();

  const prisma = {
    chat_sesiones: { findFirst },
  } as unknown as PrismaService;

  const repository = new PrismaSesionConversacionalRepository(prisma);

  const sesionBase = {
    id_sesion: '00000000-0000-4000-8000-000000000001',
    id_usuario: '00000000-0000-4000-8000-000000000002',
    id_flujo_conversacional: '00000000-0000-4000-8000-000000000003',
    version_arbol_utilizada: 1,
    modalidad_activa: 'GRUPAL',
    tipo_dependencia: null,
    tipo_craving: null,
    id_nodo_actual: '00000000-0000-4000-8000-000000000004',
    fecha_inicio: new Date('2026-10-19T12:00:00Z'),
    fecha_ultima_interaccion: new Date('2026-10-19T12:30:00Z'),
  };

  beforeEach(() => {
    findFirst.mockReset();
  });

  it.each(['ACTIVA', 'PAUSADA', 'COMPLETADA'])(
    'consulta por identificador y propietario, incluso en estado %s',
    async (estado) => {
      findFirst.mockResolvedValue({
        ...sesionBase,
        estado_sesiones: { estado_actual: estado },
      });
      const resultado = await repository.buscarPorIdYUsuario(
        sesionBase.id_sesion,
        sesionBase.id_usuario,
      );
      expect(findFirst).toHaveBeenCalledWith({
        where: {
          id_sesion: sesionBase.id_sesion,
          id_usuario: sesionBase.id_usuario,
        },
        include: { estado_sesiones: true },
      });
      expect(resultado?.estadoActual).toBe(estado);
      expect(resultado?.idNodoActual).toBe(sesionBase.id_nodo_actual);
    },
  );

  it('retorna null cuando la sesión solicitada no pertenece al usuario', async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      repository.buscarPorIdYUsuario('sesion-ajena', sesionBase.id_usuario),
    ).resolves.toBeNull();
  });

  it('no considera disponible una sesión sin registro de estado', async () => {
    findFirst.mockResolvedValue({ ...sesionBase, estado_sesiones: null });
    await expect(
      repository.buscarPorIdYUsuario(
        sesionBase.id_sesion,
        sesionBase.id_usuario,
      ),
    ).resolves.toBeNull();
  });

  it('recupera una sesión ACTIVA', async () => {
    findFirst.mockResolvedValue({
      ...sesionBase,
      estado_sesiones: { estado_actual: 'ACTIVA' },
    });

    const resultado = await repository.buscarUltimaNoCompletada(
      sesionBase.id_usuario,
    );

    expect(resultado).toMatchObject({
      idSesion: sesionBase.id_sesion,
      idUsuario: sesionBase.id_usuario,
      idNodoActual: sesionBase.id_nodo_actual,
      modalidadActiva: 'GRUPAL',
      estadoActual: 'ACTIVA',
    });
  });

  it('recupera una sesión PAUSADA', async () => {
    findFirst.mockResolvedValue({
      ...sesionBase,
      estado_sesiones: { estado_actual: 'PAUSADA' },
    });

    const resultado = await repository.buscarUltimaNoCompletada(
      sesionBase.id_usuario,
    );

    expect(resultado?.estadoActual).toBe('PAUSADA');
    expect(resultado?.idNodoActual).toBe(sesionBase.id_nodo_actual);
  });

  it('excluye sesiones COMPLETADA y pendientes duplicadas de un árbol ya completado', async () => {
    findFirst.mockResolvedValue(null);

    const resultado = await repository.buscarUltimaNoCompletada(
      sesionBase.id_usuario,
    );

    expect(resultado).toBeNull();

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id_usuario: sesionBase.id_usuario,
          AND: [
            {
              OR: [
                {
                  estado_sesiones: {
                    is: { estado_actual: { not: 'COMPLETADA' } },
                  },
                },
                { estado_sesiones: { is: null } },
              ],
            },
            {
              OR: [
                { id_flujo_conversacional: null },
                {
                  flujo_conversacion: {
                    is: {
                      sesiones: {
                        none: {
                          id_usuario: sesionBase.id_usuario,
                          estado_sesiones: {
                            is: { estado_actual: 'COMPLETADA' },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    );
  });

  describe('buscarCompletadaDelArbol', () => {
    it('busca la COMPLETADA del usuario por flujo y versión, la más reciente primero', async () => {
      findFirst.mockResolvedValue({
        ...sesionBase,
        estado_sesiones: { estado_actual: 'COMPLETADA' },
      });

      const resultado = await repository.buscarCompletadaDelArbol(
        sesionBase.id_usuario,
        sesionBase.id_flujo_conversacional,
        1,
      );

      expect(findFirst).toHaveBeenCalledWith({
        where: {
          id_usuario: sesionBase.id_usuario,
          id_flujo_conversacional: sesionBase.id_flujo_conversacional,
          version_arbol_utilizada: 1,
          estado_sesiones: { is: { estado_actual: 'COMPLETADA' } },
        },
        include: { estado_sesiones: true },
        orderBy: [
          { fecha_ultima_interaccion: 'desc' },
          { fecha_inicio: 'desc' },
          { id_sesion: 'desc' },
        ],
      });
      expect(resultado?.estadoActual).toBe('COMPLETADA');
      expect(resultado?.idSesion).toBe(sesionBase.id_sesion);
    });

    it('retorna null si el usuario no completó ese árbol', async () => {
      findFirst.mockResolvedValue(null);
      await expect(
        repository.buscarCompletadaDelArbol(
          sesionBase.id_usuario,
          'otro-flujo',
          2,
        ),
      ).resolves.toBeNull();
    });
  });

  it('informa la inconsistencia de una sesión sin registro de estado', async () => {
    findFirst.mockResolvedValue({
      ...sesionBase,
      estado_sesiones: null,
    });

    await expect(
      repository.buscarUltimaNoCompletada(sesionBase.id_usuario),
    ).rejects.toMatchObject({ codigo: 'ESTADO_INCONSISTENTE' });
  });
});
