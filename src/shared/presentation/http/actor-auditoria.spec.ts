import type { Socket } from 'net';
import type { AuthenticatedSessionRequest } from '../../../modules/usuarios/presentation/http/authenticated-session-request';
import { actorAuditoria } from './actor-auditoria';

const idUsuario = '00000000-0000-4000-8000-0000000000ad';
const idSesion = '00000000-0000-4000-8000-0000000a0701';

const solicitud = (
  cambios: { ip?: string; remota?: string; idSesion?: unknown } = {},
) =>
  ({
    ip: cambios.ip,
    socket: { remoteAddress: cambios.remota } as Socket,
    autenticacion: {
      usuario: { id_usuario: idUsuario },
      sesion: {
        id_sesion: 'idSesion' in cambios ? cambios.idSesion : idSesion,
      },
    },
  }) as unknown as AuthenticatedSessionRequest;

describe('actorAuditoria (RF-123)', () => {
  it('usuario, sesión de autenticación e IP de la petición', () => {
    expect(actorAuditoria(solicitud({ ip: '203.0.113.7' }))).toEqual({
      idUsuario,
      idSesionAutenticacion: idSesion,
      direccionIp: '203.0.113.7',
    });
  });

  it('usa la dirección del socket si Express no informa la IP', () => {
    expect(
      actorAuditoria(solicitud({ remota: '::ffff:127.0.0.1' }))?.direccionIp,
    ).toBe('::ffff:127.0.0.1');
  });

  it.each([
    ['sin IP', solicitud()],
    ['con IP vacía', solicitud({ ip: '  ' })],
    ['con IP demasiado larga', solicitud({ ip: 'x'.repeat(46) })],
    [
      'sin sesión de autenticación',
      solicitud({ ip: '1.1.1.1', idSesion: undefined }),
    ],
    ['con sesión no UUID', solicitud({ ip: '1.1.1.1', idSesion: 'abc' })],
    ['sin autenticación', { ip: '1.1.1.1' } as AuthenticatedSessionRequest],
  ])('null %s', (_, s) => {
    expect(actorAuditoria(s)).toBeNull();
  });
});
