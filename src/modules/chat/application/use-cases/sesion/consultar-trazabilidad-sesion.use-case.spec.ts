import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { SesionConversacionalNoEncontradaException } from '../../../domain/exceptions/sesion.exceptions';
import { HistorialInteraccionesRepository } from '../../../domain/repositories/historial-interacciones.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { HistorialConversacionalInconsistenteException } from '../../exceptions/historial-conversacional-inconsistente.exception';
import { SeudonimoParticipantePort } from '../../ports/seudonimo-participante.port';
import { ConsultarTrazabilidadSesionUseCase } from './consultar-trazabilidad-sesion.use-case';

const idSesion = '00000000-0000-4000-8000-000000000001';
const idUsuario = '00000000-0000-4000-8000-000000000002';
const nodoA = '00000000-0000-4000-8000-00000000000a';
const nodoB = '00000000-0000-4000-8000-00000000000b';
const nodoFin = '00000000-0000-4000-8000-00000000000f';
const t1 = new Date('2026-11-20T14:00:00.000Z');
const t2 = new Date('2026-11-20T14:01:00.000Z');

describe('ConsultarTrazabilidadSesionUseCase', () => {
  let sesiones: jest.Mocked<
    Pick<SesionConversacionalRepository, 'buscarPorId'>
  >;
  let historial: jest.Mocked<
    Pick<HistorialInteraccionesRepository, 'consultarCompleta'>
  >;
  const obtenerSeudonimo = jest.fn<Promise<string>, [string]>();
  let useCase: ConsultarTrazabilidadSesionUseCase;

  beforeEach(() => {
    sesiones = {
      buscarPorId: jest
        .fn()
        .mockResolvedValue(
          new SesionConversacional(
            idSesion,
            idUsuario,
            '00000000-0000-4000-8000-000000000003',
            1,
            ModalidadConversacional.GRUPAL,
            null,
            null,
            nodoFin,
            'COMPLETADA',
            t1,
            t2,
          ),
        ),
    };
    historial = {
      consultarCompleta: jest.fn().mockResolvedValue([
        {
          idInteraccion: 'i1',
          secuencia: 1,
          timestampInteraccion: t1,
          idNodo: nodoA,
          idNodoDestino: nodoB,
          tipoEntrada: 'ESCALA',
          valor: 7,
        },
        {
          idInteraccion: 'i2',
          secuencia: 2,
          timestampInteraccion: t2,
          idNodo: nodoB,
          idNodoDestino: null,
          tipoEntrada: 'CONTINUAR',
          valor: null,
        },
      ]),
    };
    obtenerSeudonimo.mockReset().mockResolvedValue('P-1A2B3C4D');
    const seudonimos: SeudonimoParticipantePort = { obtener: obtenerSeudonimo };
    useCase = new ConsultarTrazabilidadSesionUseCase(
      sesiones as unknown as SesionConversacionalRepository,
      historial as unknown as HistorialInteraccionesRepository,
      seudonimos,
    );
  });

  it('devuelve la secuencia completa con el seudónimo del participante', async () => {
    const r = await useCase.obtenerSesion(idSesion.toUpperCase());

    expect(sesiones.buscarPorId).toHaveBeenCalledWith(idSesion);
    expect(historial.consultarCompleta).toHaveBeenCalledWith(idSesion);
    expect(obtenerSeudonimo).toHaveBeenCalledWith(idUsuario);
    expect(r).toEqual({
      id_sesion: idSesion,
      id_participante: 'P-1A2B3C4D',
      registros: [
        {
          secuencia: 1,
          id_nodo: nodoA,
          respuesta_usuario: { valor: 7 },
          id_nodo_destino: nodoB,
          timestamp_interaccion: '2026-11-20T14:00:00.000Z',
        },
        {
          secuencia: 2,
          id_nodo: nodoB,
          respuesta_usuario: { valor: null },
          id_nodo_destino: null,
          timestamp_interaccion: '2026-11-20T14:01:00.000Z',
        },
      ],
    });
  });

  it('una sesión sin interacciones devuelve registros vacíos', async () => {
    historial.consultarCompleta.mockResolvedValue([]);

    const r = await useCase.execute(idSesion);

    expect(r.registros).toEqual([]);
  });

  it('404 si la sesión no existe, sin crear seudónimo', async () => {
    sesiones.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(idSesion)).rejects.toBeInstanceOf(
      SesionConversacionalNoEncontradaException,
    );
    expect(obtenerSeudonimo).not.toHaveBeenCalled();
  });

  it('422 HISTORIAL_INCONSISTENTE si la integridad falla', async () => {
    historial.consultarCompleta.mockResolvedValue(null);

    await expect(useCase.execute(idSesion)).rejects.toBeInstanceOf(
      HistorialConversacionalInconsistenteException,
    );
    expect(obtenerSeudonimo).not.toHaveBeenCalled();
  });
});
