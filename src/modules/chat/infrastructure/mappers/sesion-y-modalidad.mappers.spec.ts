import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { AsignacionModalidadMapper } from './asignacion-modalidad.mapper';
import { PerfilClinicoConversacionalMapper } from './perfil-clinico-conversacional.mapper';
import { SesionConversacionalMapper } from './sesion-conversacional.mapper';

describe('Mappers de sesión, perfil clínico y modalidad', () => {
  const fecha = new Date('2026-10-01T12:00:00.000Z');
  const ids = {
    sesion: '00000000-0000-4000-8000-000000000001',
    usuario: '00000000-0000-4000-8000-000000000002',
    flujo: '00000000-0000-4000-8000-000000000003',
    nodo: '00000000-0000-4000-8000-000000000004',
  };

  it('convierte la sesión con su estado a entidad', () => {
    const sesion = SesionConversacionalMapper.toDomain({
      id_sesion: ids.sesion,
      id_usuario: ids.usuario,
      id_flujo_conversacional: ids.flujo,
      version_arbol_utilizada: 2,
      modalidad_activa: 'GRUPAL',
      tipo_dependencia: null,
      tipo_craving: null,
      id_nodo_actual: ids.nodo,
      fecha_inicio: fecha,
      fecha_ultima_interaccion: fecha,
      estado_sesiones: { estado_actual: 'PAUSADA' },
    } as never);

    expect(sesion).toMatchObject({
      idSesion: ids.sesion,
      estadoActual: 'PAUSADA',
      versionArbolUtilizada: 2,
    });
  });

  it('rechaza una sesión sin estado registrado', () => {
    expect(() =>
      SesionConversacionalMapper.toDomain({ estado_sesiones: null } as never),
    ).toThrow();
  });

  it('incluye flujo, versión y nodo al crear una sesión activa', () => {
    const sesion = SesionConversacional.iniciar(
      {
        idSesion: ids.sesion,
        idUsuario: ids.usuario,
        idFlujoConversacional: ids.flujo,
        versionArbolUtilizada: 2,
        modalidadActiva: ModalidadConversacional.GRUPAL,
        tipoDependencia: null,
        tipoCraving: null,
        idNodoInicial: ids.nodo,
      },
      fecha,
    );

    expect(SesionConversacionalMapper.toCreateData(sesion)).toMatchObject({
      id_flujo_conversacional: ids.flujo,
      version_arbol_utilizada: 2,
      id_nodo_actual: ids.nodo,
      estado_sesiones: { create: { estado_actual: 'ACTIVA' } },
    });
  });

  it('omite flujo, versión y nodo al crear una sesión en ERROR_CONFIGURACION', () => {
    const sesion = SesionConversacional.registrarErrorConfiguracion(
      {
        idSesion: ids.sesion,
        idUsuario: ids.usuario,
        modalidadActiva: ModalidadConversacional.PERSONALIZADA,
        tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
        tipoCraving: TipoCravingClinico.NEGATIVO,
      },
      fecha,
    );

    const datos = SesionConversacionalMapper.toCreateData(sesion);

    expect(datos).not.toHaveProperty('id_flujo_conversacional');
    expect(datos).not.toHaveProperty('version_arbol_utilizada');
    expect(datos).not.toHaveProperty('id_nodo_actual');
    expect(datos).toMatchObject({
      estado_sesiones: { create: { estado_actual: 'ERROR_CONFIGURACION' } },
    });
  });

  it('calcula que el perfil clínico está completo solo con ambas dimensiones', () => {
    expect(
      PerfilClinicoConversacionalMapper.toDomain({
        tipo_dependencia: 'TOLERANCIA',
        tipo_craving: 'NEGATIVO',
      } as never).completo,
    ).toBe(true);
    expect(
      PerfilClinicoConversacionalMapper.toDomain({
        tipo_dependencia: 'TOLERANCIA',
        tipo_craving: null,
      } as never).completo,
    ).toBe(false);
  });

  it('marca como estudiante y cuenta activa a partir de la fila de asignación', () => {
    const vigente = AsignacionModalidadMapper.toDomain({
      id_tipo_terapia: 'a-1',
      id_usuario: ids.usuario,
      id_programa: 12,
      modalidad: 'GRUPAL',
      fecha_vigencia_desde: fecha,
      administrador_responsable: null,
      usuarios_tipo_terapia_id_usuarioTousuarios: {
        rol: Rol.ESTUDIANTE,
        estado_cuenta: 'ACTIVA',
        perfil_clinico: { perfil_completo: true },
      },
    } as never);

    expect(vigente.asignacion.idPrograma).toBe(12);
    expect(vigente.esEstudiante).toBe(true);
    expect(vigente.cuentaActiva).toBe(true);
    expect(vigente.perfilCompleto).toBe(true);
  });
});
