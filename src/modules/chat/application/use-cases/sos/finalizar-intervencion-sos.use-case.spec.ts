import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { IntervencionSos } from '../../../domain/entities/sos/intervencion-sos.entity';
import {
  EstadoIntervencionSos,
  EstadoSesionAnteriorSos,
  ModuloOrigenSos,
  MotivoFinalizacionSos,
} from '../../../domain/enums/intervencion-sos.enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  IntervencionSosFinalizadaException,
  IntervencionSosNoEncontradaException,
} from '../../../domain/exceptions';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import {
  IntervencionSosPort,
  IntervencionSosTransaccion,
} from '../../ports/intervencion-sos.port';
import { FinalizarIntervencionSosUseCase } from './finalizar-intervencion-sos.use-case';

const idIntervencion = '00000000-0000-4000-8000-0000000000a9';
const idUsuario = '00000000-0000-4000-8000-0000000000e1';
const idSesionPausada = '00000000-0000-4000-8000-0000000000e2';
const idNodoPausado = '00000000-0000-4000-8000-0000000000e3';
const contexto = {
  modulo: ModuloOrigenSos.CHAT,
  ruta: '/chat',
  estado: { borrador: 'casi' },
};

function intervencion(
  estado: EstadoIntervencionSos,
  duracion: number | null,
  idPausada: string | null = idSesionPausada,
): IntervencionSos {
  return new IntervencionSos(
    idIntervencion,
    idUsuario,
    '00000000-0000-4000-8000-0000000000b9',
    idPausada,
    idPausada === null
      ? EstadoSesionAnteriorSos.NINGUNA
      : EstadoSesionAnteriorSos.ACTIVA,
    null,
    estado,
    contexto,
    new Date('2026-11-20T09:40:00.000Z'),
    new Date('2026-11-20T09:41:00.000Z'),
    duracion,
    false,
  );
}

describe('FinalizarIntervencionSosUseCase (RF-43)', () => {
  let tx: jest.Mocked<IntervencionSosTransaccion>;
  let sos: jest.Mocked<IntervencionSosPort>;
  let sesiones: jest.Mocked<SesionConversacionalRepository>;
  let useCase: FinalizarIntervencionSosUseCase;

  beforeEach(() => {
    tx = {
      bloquear: jest.fn(),
      cerrar: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<IntervencionSosTransaccion>;
    sos = {
      ejecutar: jest.fn((operacion) => operacion(tx)),
    } as unknown as jest.Mocked<IntervencionSosPort>;
    sesiones = {
      buscarPorIdYUsuario: jest
        .fn()
        .mockResolvedValue(
          new SesionConversacional(
            idSesionPausada,
            idUsuario,
            null,
            null,
            ModalidadConversacional.GRUPAL,
            null,
            null,
            idNodoPausado,
            'PAUSADA',
            new Date(),
            new Date(),
          ),
        ),
    } as unknown as jest.Mocked<SesionConversacionalRepository>;
    useCase = new FinalizarIntervencionSosUseCase(sos, sesiones);
  });

  it.each([
    [MotivoFinalizacionSos.COMPLETADA, EstadoIntervencionSos.COMPLETA],
    [
      MotivoFinalizacionSos.CERRADA_POR_USUARIO,
      EstadoIntervencionSos.INCOMPLETA,
    ],
    [MotivoFinalizacionSos.TIEMPO_AGOTADO, EstadoIntervencionSos.EXPIRADA],
  ])('%s pide el cierre como %s', async (motivo, estado) => {
    tx.bloquear
      .mockResolvedValueOnce(intervencion(EstadoIntervencionSos.EN_CURSO, null))
      .mockResolvedValueOnce(intervencion(estado, 15));

    await useCase.execute(idIntervencion, idUsuario, motivo);

    expect(tx.cerrar).toHaveBeenCalledWith(idIntervencion, estado);
  });

  it('devuelve la duración del servidor, la sesión pausada y el contexto de retorno', async () => {
    tx.bloquear
      .mockResolvedValueOnce(intervencion(EstadoIntervencionSos.EN_CURSO, null))
      .mockResolvedValueOnce(
        intervencion(EstadoIntervencionSos.INCOMPLETA, 15),
      );

    const respuesta = await useCase.execute(
      idIntervencion,
      idUsuario,
      MotivoFinalizacionSos.CERRADA_POR_USUARIO,
    );

    expect(sesiones.buscarPorIdYUsuario).toHaveBeenCalledWith(
      idSesionPausada,
      idUsuario,
    );
    expect(respuesta).toEqual({
      duracion_segundos: 15,
      estado: EstadoIntervencionSos.INCOMPLETA,
      sesion_pausada: {
        id_sesion: idSesionPausada,
        id_nodo_actual: idNodoPausado,
      },
      contexto_retorno: contexto,
    });
  });

  it('sesion_pausada es null si no había sesión de terapia', async () => {
    tx.bloquear
      .mockResolvedValueOnce(
        intervencion(EstadoIntervencionSos.EN_CURSO, null, null),
      )
      .mockResolvedValueOnce(
        intervencion(EstadoIntervencionSos.COMPLETA, 48, null),
      );

    const respuesta = await useCase.execute(
      idIntervencion,
      idUsuario,
      MotivoFinalizacionSos.COMPLETADA,
    );

    expect(respuesta.sesion_pausada).toBeNull();
    expect(sesiones.buscarPorIdYUsuario).not.toHaveBeenCalled();
  });

  it('404 si la intervención no existe o es de otro estudiante', async () => {
    tx.bloquear.mockResolvedValue(null);

    await expect(
      useCase.execute(
        idIntervencion,
        idUsuario,
        MotivoFinalizacionSos.COMPLETADA,
      ),
    ).rejects.toBeInstanceOf(IntervencionSosNoEncontradaException);
    expect(tx.cerrar).not.toHaveBeenCalled();
  });

  it('409 INTERVENCION_FINALIZADA si ya se cerró', async () => {
    tx.bloquear.mockResolvedValue(
      intervencion(EstadoIntervencionSos.EXPIRADA, 60),
    );

    await expect(
      useCase.execute(
        idIntervencion,
        idUsuario,
        MotivoFinalizacionSos.TIEMPO_AGOTADO,
      ),
    ).rejects.toBeInstanceOf(IntervencionSosFinalizadaException);
    expect(tx.cerrar).not.toHaveBeenCalled();
  });
});
