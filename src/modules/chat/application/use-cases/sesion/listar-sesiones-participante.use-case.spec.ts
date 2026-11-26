import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ParticipanteNoEncontradoException } from '../../../domain/exceptions/sesion.exceptions';
import {
  ResumenSesionConversacional,
  SesionConversacionalRepository,
} from '../../../domain/repositories/sesion-conversacional.repository';
import { CursorSesionesInvalidoException } from '../../exceptions/cursor-sesiones-invalido.exception';
import { SeudonimoParticipantePort } from '../../ports/seudonimo-participante.port';
import {
  codificarCursorSesiones,
  decodificarCursorSesiones,
} from '../../services/cursor-sesiones-participante';
import { ListarSesionesParticipanteUseCase } from './listar-sesiones-participante.use-case';

const codigo = 'P-1A2B3C4D';
const idUsuario = '00000000-0000-4000-8000-0000000000aa';
const otroUsuario = '00000000-0000-4000-8000-000000000009';
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const resumen = (
  n: number,
  cambios: Partial<ResumenSesionConversacional> = {},
): ResumenSesionConversacional => ({
  idSesion: `00000000-0000-4000-8000-00000000000${n}`,
  idUsuario,
  modalidad: ModalidadConversacional.GRUPAL,
  estado: 'COMPLETADA',
  fechaInicio: new Date(`2026-11-2${n}T14:00:00.000Z`),
  fechaUltimaInteraccion: new Date(`2026-11-2${n}T14:20:00.000Z`),
  marcaOrden: `2026-11-2${n}T14:20:00.123456Z`,
  ...cambios,
});

describe('ListarSesionesParticipanteUseCase (RF-38, M-8)', () => {
  let sesiones: jest.Mocked<
    Pick<SesionConversacionalRepository, 'listarPorUsuario'>
  >;
  const resolver = jest.fn<Promise<string | null>, [string]>();
  const obtener = jest.fn<Promise<string>, [string]>();
  let useCase: ListarSesionesParticipanteUseCase;

  beforeEach(() => {
    sesiones = {
      listarPorUsuario: jest.fn().mockResolvedValue({
        sesiones: [
          resumen(2),
          resumen(1, {
            modalidad: ModalidadConversacional.SOS,
            estado: 'ACTIVA',
          }),
        ],
        total: 2,
        hayMas: false,
      }),
    };
    resolver.mockReset().mockResolvedValue(idUsuario);
    obtener.mockReset();
    const seudonimos: SeudonimoParticipantePort = { obtener, resolver };
    useCase = new ListarSesionesParticipanteUseCase(
      sesiones as unknown as SesionConversacionalRepository,
      seudonimos,
    );
  });

  it('lista las sesiones del participante con sus datos permitidos', async () => {
    const r = await useCase.execute(codigo, { limite: 20 });

    expect(resolver).toHaveBeenCalledWith(codigo);
    expect(sesiones.listarPorUsuario).toHaveBeenCalledWith(idUsuario, 20, null);
    expect(r).toEqual({
      id_participante: codigo,
      items: [
        {
          id_sesion: '00000000-0000-4000-8000-000000000002',
          modalidad: 'GRUPAL',
          estado: 'COMPLETADA',
          fecha_inicio: '2026-11-22T14:00:00.000Z',
          fecha_ultima_interaccion: '2026-11-22T14:20:00.000Z',
        },
        {
          id_sesion: '00000000-0000-4000-8000-000000000001',
          modalidad: 'SOS',
          estado: 'ACTIVA',
          fecha_inicio: '2026-11-21T14:00:00.000Z',
          fecha_ultima_interaccion: '2026-11-21T14:20:00.000Z',
        },
      ],
      total: 2,
      siguiente_cursor: null,
    });
  });

  it('no expone el UUID del estudiante ni crea seudónimos', async () => {
    const r = await useCase.execute(codigo, { limite: 20 });
    const json = JSON.stringify(r);

    expect(json).not.toContain(idUsuario);
    expect(Object.keys(r.items[0]).sort()).toEqual([
      'estado',
      'fecha_inicio',
      'fecha_ultima_interaccion',
      'id_sesion',
      'modalidad',
    ]);
    expect(obtener).not.toHaveBeenCalled();
    // Los únicos UUID son los id_sesion.
    expect(json.match(new RegExp(UUID, 'gi'))).toHaveLength(2);
  });

  it('participante sin sesiones: lista vacía, no es error', async () => {
    sesiones.listarPorUsuario.mockResolvedValue({
      sesiones: [],
      total: 0,
      hayMas: false,
    });

    expect(await useCase.execute(codigo, { limite: 20 })).toEqual({
      id_participante: codigo,
      items: [],
      total: 0,
      siguiente_cursor: null,
    });
  });

  it('404 PARTICIPANTE_NO_ENCONTRADO si el código no existe, sin consultar sesiones', async () => {
    resolver.mockResolvedValue(null);

    await expect(
      useCase.execute(codigo, { limite: 20 }),
    ).rejects.toBeInstanceOf(ParticipanteNoEncontradoException);
    expect(sesiones.listarPorUsuario).not.toHaveBeenCalled();
  });

  it('con más páginas, el cursor apunta a la última sesión con su marca exacta', async () => {
    sesiones.listarPorUsuario.mockResolvedValue({
      sesiones: [resumen(2), resumen(1)],
      total: 5,
      hayMas: true,
    });

    const r = await useCase.execute(codigo, { limite: 2 });

    expect(r.total).toBe(5);
    expect(decodificarCursorSesiones(r.siguiente_cursor!)).toEqual({
      fechaUltimaInteraccion: '2026-11-21T14:20:00.123456Z',
      idSesion: '00000000-0000-4000-8000-000000000001',
    });
  });

  it('el cursor recibido se pasa decodificado al repositorio', async () => {
    const cursor = codificarCursorSesiones({
      fechaUltimaInteraccion: '2026-11-21T14:20:00.123456Z',
      idSesion: '00000000-0000-4000-8000-000000000001',
    });

    await useCase.execute(codigo, { limite: 2, cursor });

    expect(sesiones.listarPorUsuario).toHaveBeenCalledWith(idUsuario, 2, {
      fechaUltimaInteraccion: '2026-11-21T14:20:00.123456Z',
      idSesion: '00000000-0000-4000-8000-000000000001',
    });
  });

  it('400 con un cursor que no generó el servicio', async () => {
    await expect(
      useCase.execute(codigo, { limite: 2, cursor: 'Zm9vYmFy' }),
    ).rejects.toBeInstanceOf(CursorSesionesInvalidoException);
    expect(resolver).not.toHaveBeenCalled();
  });

  it('aislamiento: nunca entrega una sesión de otro participante', async () => {
    sesiones.listarPorUsuario.mockResolvedValue({
      sesiones: [resumen(1, { idUsuario: otroUsuario })],
      total: 1,
      hayMas: false,
    });

    await expect(useCase.execute(codigo, { limite: 20 })).rejects.toThrow(
      'otro participante',
    );
  });
});
