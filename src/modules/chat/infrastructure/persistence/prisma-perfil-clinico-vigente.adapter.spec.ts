import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaPerfilClinicoVigenteAdapter } from './prisma-perfil-clinico-vigente.adapter';

describe('PrismaPerfilClinicoVigenteAdapter', () => {
  const idUsuario = '8f1c2a7e-3b4d-4e5f-9a10-1b2c3d4e5f60';
  const perfil = {
    id_usuario: idUsuario,
    tipo_dependencia: 'ABSTINENCIA_FISICA',
    tipo_craving: 'NEGATIVO',
    modalidad_terapeutica_activa: 'PERSONALIZADA',
    estado_perfil_clinico: 'ACTIVO',
    fecha_clasificacion: new Date('2026-11-20T14:30:00Z'),
    fuente_clasificacion: 'CHAT',
  };
  const consultar = jest.fn();
  const adapter = new PrismaPerfilClinicoVigenteAdapter({
    $queryRaw: consultar,
  } as unknown as PrismaService);

  beforeEach(() => jest.resetAllMocks());

  it('consulta con el UUID como parámetro y entrega el contrato interno', async () => {
    consultar.mockResolvedValue([perfil]);

    await expect(adapter.obtener(idUsuario)).resolves.toEqual(perfil);
    expect(consultar).toHaveBeenCalledWith(expect.any(Array), idUsuario);
  });

  it('reporta que no existe una sesión elegible', async () => {
    consultar.mockResolvedValue([]);

    await expect(adapter.obtener(idUsuario)).rejects.toMatchObject({
      codigo: 'SIN_SESION_CONVERSACIONAL',
      tipo: 'NO_PROCESABLE',
    });
  });

  it.each([
    { tipo_dependencia: 'ALTA' },
    { tipo_craving: 'EMOCIONAL' },
    { modalidad_terapeutica_activa: 'INDIVIDUAL' },
    { modalidad_terapeutica_activa: null },
  ])('rechaza valores clínicos fuera del contrato (%j)', async (valor) => {
    consultar.mockResolvedValue([{ ...perfil, ...valor }]);

    await expect(adapter.obtener(idUsuario)).rejects.toMatchObject({
      codigo: 'VALOR_CLINICO_INVALIDO',
      tipo: 'SOLICITUD_INVALIDA',
    });
  });
});
