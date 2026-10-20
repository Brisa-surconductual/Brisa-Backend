import { EstadoCuenta } from '../../../usuarios/domain/enums/estado-cuenta';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AsignacionModalidadVigente } from '../repositories/modalidad-programa.repository';
import { PoliticaParticipanteActivoPrograma } from './politica-participante-activo-programa.service';

describe('PoliticaParticipanteActivoPrograma', () => {
  const politica = new PoliticaParticipanteActivoPrograma();

  const asignacion: AsignacionModalidadVigente = {
    idUsuario: 'usuario-1',
    rol: Rol.ESTUDIANTE,
    estadoCuenta: EstadoCuenta.ACTIVA,
    modalidad: 'GRUPAL' as AsignacionModalidadVigente['modalidad'],
    perfilCompleto: false,
  };

  it('incluye estudiantes con cuenta activa', () => {
    expect(politica.esActivo(asignacion)).toBe(true);
  });

  it('excluye cuentas bloqueadas', () => {
    expect(politica.esActivo({
      ...asignacion,
      estadoCuenta: EstadoCuenta.BLOQUEADA,
    })).toBe(false);
  });

  it('excluye cuentas pendientes de activacion', () => {
    expect(politica.esActivo({
      ...asignacion,
      estadoCuenta: EstadoCuenta.PENDIENTE_ACTIVACION,
    })).toBe(false);
  });

  it('excluye usuarios administrativos', () => {
    expect(politica.esActivo({
      ...asignacion,
      rol: Rol.ADMINISTRATIVO,
    })).toBe(false);
  });

  it('no exige un perfil completo para contar al participante', () => {
    expect(politica.esActivo({
      ...asignacion,
      perfilCompleto: false,
    })).toBe(true);
  });
});
