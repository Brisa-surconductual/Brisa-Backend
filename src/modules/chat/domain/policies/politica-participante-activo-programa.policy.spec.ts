import { AsignacionModalidad } from '../entities/modalidad/asignacion-modalidad.entity';
import { AsignacionModalidadVigente } from '../entities/modalidad/asignacion-modalidad-vigente';
import { ModalidadConversacional } from '../enums/modalidad-conversacional-enum';
import { PoliticaParticipanteActivoPrograma } from './politica-participante-activo-programa.policy';

describe('PoliticaParticipanteActivoPrograma', () => {
  const politica = new PoliticaParticipanteActivoPrograma();

  const crear = (
    cambios: Partial<{
      idUsuario: string;
      esEstudiante: boolean;
      cuentaActiva: boolean;
      perfilCompleto: boolean;
    }> = {},
  ): AsignacionModalidadVigente => {
    const datos = {
      idUsuario: 'usuario-1',
      esEstudiante: true,
      cuentaActiva: true,
      perfilCompleto: false,
      ...cambios,
    };

    return new AsignacionModalidadVigente(
      new AsignacionModalidad(
        `asignacion-${datos.idUsuario}`,
        datos.idUsuario,
        12,
        ModalidadConversacional.GRUPAL,
        new Date('2026-10-01T00:00:00Z'),
      ),
      datos.esEstudiante,
      datos.cuentaActiva,
      datos.perfilCompleto,
    );
  };

  it('incluye estudiantes con cuenta activa', () => {
    expect(politica.esActivo(crear())).toBe(true);
  });

  it('excluye cuentas que no estan activas', () => {
    expect(politica.esActivo(crear({ cuentaActiva: false }))).toBe(false);
  });

  it('excluye usuarios que no son estudiantes', () => {
    expect(politica.esActivo(crear({ esEstudiante: false }))).toBe(false);
  });

  it('no exige un perfil completo para contar al participante', () => {
    expect(politica.esActivo(crear({ perfilCompleto: false }))).toBe(true);
  });

  it('filtra solo los participantes activos', () => {
    const activa = crear();
    const inactiva = crear({ idUsuario: 'usuario-2', cuentaActiva: false });

    expect(politica.filtrar([activa, inactiva])).toEqual([activa]);
  });
});
