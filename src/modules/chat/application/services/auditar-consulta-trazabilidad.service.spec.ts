import { EventoAuditoriaAdministrativa } from '../../../../shared/application/ports/auditoria-administrativa.port';
import { SesionConversacionalRepository } from '../../domain/repositories/sesion-conversacional.repository';
import { SeudonimoParticipantePort } from '../ports/seudonimo-participante.port';
import {
  AuditarConsultaTrazabilidadService,
  OperacionConsultaTrazabilidad as Operacion,
} from './auditar-consulta-trazabilidad.service';

const actor = {
  idUsuario: '00000000-0000-4000-8000-0000000000ad',
  idSesionAutenticacion: '00000000-0000-4000-8000-0000000a0701',
  direccionIp: '203.0.113.7',
};
const idSesionConversacional = '00000000-0000-4000-8000-000000000001';
const idParticipante = '00000000-0000-4000-8000-000000000002';

describe('AuditarConsultaTrazabilidadService (RF-123)', () => {
  const registrar = jest.fn<Promise<string>, [EventoAuditoriaAdministrativa]>();
  const buscarPorId = jest.fn<
    Promise<{ idUsuario: string } | null>,
    [string]
  >();
  const resolver = jest.fn<Promise<string | null>, [string]>();
  const servicio = new AuditarConsultaTrazabilidadService(
    { registrar },
    { buscarPorId } as unknown as SesionConversacionalRepository,
    { resolver } as unknown as SeudonimoParticipantePort,
  );
  const traza = {
    operacion: Operacion.CONSULTAR_TRAZABILIDAD_SESION,
    actor,
    idSesionConversacional: idSesionConversacional.toUpperCase(),
  };
  const listado = {
    operacion: Operacion.LISTAR_SESIONES_PARTICIPANTE,
    actor,
    codigoParticipante: ' p-1a2b3c4d ',
  };

  beforeEach(() => {
    registrar.mockReset().mockResolvedValue('id-auditoria');
    buscarPorId.mockReset().mockResolvedValue({ idUsuario: idParticipante });
    resolver.mockReset().mockResolvedValue(idParticipante);
  });

  it('trazabilidad EXITOSA: recurso = sesión conversacional; actor = sesión de autenticación', async () => {
    await servicio.registrarExitosa(traza);

    expect(registrar).toHaveBeenCalledWith({
      actor,
      accion: 'CONSULTA_PARTICIPANTE',
      recursoAfectado: 'trazabilidad_sesion_chat',
      idRecurso: idSesionConversacional,
      idParticipante,
      estado: 'EXITOSA',
      detalle: { operacion: 'CONSULTAR_TRAZABILIDAD_SESION' },
    });
    expect(buscarPorId).toHaveBeenCalledWith(idSesionConversacional);
  });

  it('listado EXITOSO: resuelve el código normalizado, sin crear seudónimos', async () => {
    await servicio.registrarExitosa(listado);

    expect(resolver).toHaveBeenCalledWith('P-1A2B3C4D');
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        recursoAfectado: 'sesiones_participante_chat',
        idRecurso: null,
        idParticipante,
      }),
    );
  });

  it('EXITOSA es obligatoria: propaga el fallo de la bitácora', async () => {
    registrar.mockRejectedValue(new Error('caída'));

    await expect(servicio.registrarExitosa(traza)).rejects.toThrow('caída');
  });

  it('EXITOSA sin participante identificable: no registra y lanza', async () => {
    resolver.mockResolvedValue(null);

    await expect(servicio.registrarExitosa(listado)).rejects.toThrow();
    expect(registrar).not.toHaveBeenCalled();
  });

  it('FALLIDA: registra estado HTTP y código; si no resuelve, participante null', async () => {
    buscarPorId.mockRejectedValue(new Error('lectura caída'));

    const ok = await servicio.registrarNoExitosa(traza, 'FALLIDA', {
      estadoHttp: 422,
      codigo: 'HISTORIAL_INCONSISTENTE',
    });

    expect(ok).toBe(true);
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 'FALLIDA',
        idParticipante: null,
        detalle: {
          operacion: 'CONSULTAR_TRAZABILIDAD_SESION',
          estado_http: 422,
          codigo_resultado: 'HISTORIAL_INCONSISTENTE',
        },
      }),
    );
  });

  it('DENEGADA: no lee datos del participante', async () => {
    await servicio.registrarNoExitosa(listado, 'DENEGADA', {
      estadoHttp: 403,
      codigo: null,
    });

    expect(resolver).not.toHaveBeenCalled();
    expect(buscarPorId).not.toHaveBeenCalled();
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'DENEGADA', idParticipante: null }),
    );
  });

  it('no exitosa de mejor esfuerzo: devuelve false si la bitácora falla', async () => {
    registrar.mockRejectedValue(new Error('caída'));

    await expect(
      servicio.registrarNoExitosa(traza, 'FALLIDA', {
        estadoHttp: 404,
        codigo: null,
      }),
    ).resolves.toBe(false);
  });

  it('entradas sin formato válido no se usan ni se copian', async () => {
    await servicio.registrarNoExitosa(
      {
        operacion: Operacion.CONSULTAR_TRAZABILIDAD_SESION,
        actor,
        idSesionConversacional: "x' OR 1=1 --",
      },
      'FALLIDA',
      { estadoHttp: 400, codigo: null },
    );
    await servicio.registrarNoExitosa(
      { ...listado, codigoParticipante: '<script>' },
      'FALLIDA',
      { estadoHttp: 400, codigo: null },
    );

    expect(buscarPorId).not.toHaveBeenCalled();
    expect(resolver).not.toHaveBeenCalled();
    const serializado = JSON.stringify(registrar.mock.calls);
    expect(serializado).not.toContain('OR 1=1');
    expect(serializado).not.toContain('<script>');
  });
});
