import { HttpStatus } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { ALCANCES_SESION_KEY } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { ModalidadConversacional } from '../domain/enums/arbol-conversacional.enums';
import type { InicioSesionConversacionalResponse } from '../application/use-cases/iniciar-o-reanudar-sesion.use-case';
import { SesionesConversacionalesController } from './sesiones-conversacionales.controller';

describe('SesionesConversacionalesController - RF-24', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';

  const execute = jest.fn();

  const controller = new SesionesConversacionalesController({
    execute,
  } as never);

  const request = {
    autenticacion: {
      usuario: {
        id_usuario: idUsuario,
      },
    },
  } as never;

  const resultadoBase: InicioSesionConversacionalResponse = {
    reanudada: false,
    sesion: {
      id_sesion: '00000000-0000-4000-8000-000000000002',
      id_flujo_conversacional: '00000000-0000-4000-8000-000000000003',
      version_arbol_utilizada: 1,
      modalidad_activa: ModalidadConversacional.GRUPAL,
      tipo_dependencia: null,
      tipo_craving: null,
      estado_actual: 'ACTIVA',
      fecha_inicio: new Date('2026-10-19T12:00:00Z'),
      fecha_ultima_interaccion: new Date('2026-10-19T12:00:00Z'),
    },
    nodo_actual: {
      id_nodo: '00000000-0000-4000-8000-000000000004',
      tipo_nodo: 'MENSAJE',
      contenido: { texto: 'Bienvenido' },
      es_nodo_inicial: true,
      orden: 1,
    },
    ubicacion_temporal: {
      id_unidad_temporal: '00000000-0000-4000-8000-000000000005',
      nombre_unidad: 'Semana 1',
      finalizado_programa: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('declara autenticación, rol ESTUDIANTE, sesión completa y CSRF', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, SesionesConversacionalesController),
    ).toEqual([Rol.ESTUDIANTE]);

    expect(
      Reflect.getMetadata(
        ALCANCES_SESION_KEY,
        SesionesConversacionalesController,
      ),
    ).toEqual([AlcanceSesion.COMPLETA]);

    expect(
      Reflect.getMetadata(GUARDS_METADATA, SesionesConversacionalesController),
    ).toEqual([SessionAuthGuard, SessionScopeGuard, RolesGuard]);

    const metodoIniciar = Object.getOwnPropertyDescriptor(
      SesionesConversacionalesController.prototype,
      'iniciar',
    );

    expect(metodoIniciar).toBeDefined();

    expect(
      Reflect.getMetadata(GUARDS_METADATA, metodoIniciar?.value as object),
    ).toEqual([CsrfSessionGuard]);
  });

  it('responde 201 y data al crear una sesión', async () => {
    execute.mockResolvedValue(resultadoBase);

    const status = jest.fn();

    const respuesta = await controller.iniciar(undefined, request, {
      status,
    } as never);

    expect(execute).toHaveBeenCalledWith(idUsuario);
    expect(status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(respuesta).toEqual({ data: resultadoBase });
  });

  it('responde 200 y data al reanudar una sesión', async () => {
    const resultadoReanudado = {
      ...resultadoBase,
      reanudada: true,
    };

    execute.mockResolvedValue(resultadoReanudado);

    const status = jest.fn();

    const respuesta = await controller.iniciar(undefined, request, {
      status,
    } as never);

    expect(execute).toHaveBeenCalledWith(idUsuario);
    expect(status).toHaveBeenCalledWith(HttpStatus.OK);

    expect(respuesta.data.reanudada).toBe(true);
    expect(respuesta.data.sesion.id_sesion).toBe(
      resultadoBase.sesion.id_sesion,
    );
  });
});
