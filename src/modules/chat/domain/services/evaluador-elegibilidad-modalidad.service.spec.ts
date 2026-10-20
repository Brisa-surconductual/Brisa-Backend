import { EvaluadorElegibilidadModalidad } from './evaluador-elegibilidad-modalidad.service';

describe('EvaluadorElegibilidadModalidad', () => {
  const evaluador = new EvaluadorElegibilidadModalidad();

  it('permite la transicion cuando todos los activos tienen perfil completo', () => {
    expect(
      evaluador.evaluar({
        totalUsuariosActivos: 5,
        conPerfilCompleto: 5,
        modalidadGrupal: true,
      }),
    ).toEqual({
      totalUsuariosActivos: 5,
      conPerfilCompleto: 5,
      sinPerfilCompleto: 0,
      elegible: true,
    });
  });

  it('rechaza la transicion cuando existen perfiles incompletos', () => {
    expect(
      evaluador.evaluar({
        totalUsuariosActivos: 5,
        conPerfilCompleto: 4,
        modalidadGrupal: true,
      }),
    ).toMatchObject({
      sinPerfilCompleto: 1,
      elegible: false,
    });
  });

  it('rechaza la transicion cuando no existen participantes activos', () => {
    expect(
      evaluador.evaluar({
        totalUsuariosActivos: 0,
        conPerfilCompleto: 0,
        modalidadGrupal: true,
      }).elegible,
    ).toBe(false);
  });

  it('rechaza la transicion cuando la modalidad no es grupal', () => {
    expect(
      evaluador.evaluar({
        totalUsuariosActivos: 3,
        conPerfilCompleto: 3,
        modalidadGrupal: false,
      }).elegible,
    ).toBe(false);
  });

  it('rechaza conteos inconsistentes', () => {
    expect(() =>
      evaluador.evaluar({
        totalUsuariosActivos: 2,
        conPerfilCompleto: 3,
        modalidadGrupal: true,
      }),
    ).toThrow(RangeError);
  });
});
