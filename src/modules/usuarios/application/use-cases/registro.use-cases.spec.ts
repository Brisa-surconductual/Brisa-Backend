import {
  LineaBase,
  LineaBaseDatos,
} from '../../domain/entities/linea-bases.entity';
import { Usuario } from '../../domain/entities/usuarios.entity';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';
import {
  ConsentimientoVigente,
  RegistroRepository,
  RevisionRegistro,
} from '../../domain/repositories/registro.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { ActualizarRevisionRegistroUseCase } from './actualizar-revision-registro.use-case';
import { CompletarConsentimientoLineaBaseUseCase } from './completar-consentimiento-linea-base.use-case';

const baseData = {
  ciudad: 'Bogotá',
  entidadEducativa: 'Universidad',
  programaAcademico: 'Psicología',
  semestre: 3,
  nivelAcademico: NivelAcademico.PREGRADO,
  edad: 20,
  fechaInicioConsumo: new Date('2024-01-01T00:00:00.000Z'),
  fechaUltimoConsumo: new Date('2026-01-01T00:00:00.000Z'),
  motivoInicioConsumo: MotivoConsumo.CURIOSIDAD,
  frecuenciaConsumo: 1,
};

class RegistrationUserRepository implements UsuarioRepository {
  constructor(readonly user: Usuario) {}
  async crear(): Promise<void> {}
  async buscarPorCorreo(): Promise<Usuario | null> {
    return this.user;
  }
  async buscarPorId(): Promise<Usuario | null> {
    return this.user;
  }
  async actualizarContrasena(): Promise<void> {}
}

class RegistrationRepositoryFake implements RegistroRepository {
  completed = false;
  invalidated = false;
  updatedFields: string[] = [];
  revision: RevisionRegistro | null = null;
  consent: ConsentimientoVigente | null = {
    id: '735b9a90-2fd5-4d55-8838-84ae0a8b5251',
    version: '1.0.0',
    titulo: 'Consentimiento',
    urlContenido: 'https://example.com/consentimiento',
  };

  async obtenerConsentimientoVigente() {
    return this.consent;
  }
  async completarConsentimientoYLineaBase(): Promise<void> {
    this.completed = true;
  }
  async obtenerRevision(): Promise<RevisionRegistro | null> {
    return this.revision;
  }
  async actualizarLineaBase(
    _idUsuario: string,
    _datos: LineaBaseDatos,
    camposModificados: string[],
    invalidaConsentimiento: boolean,
  ): Promise<void> {
    this.updatedFields = camposModificados;
    this.invalidated = invalidaConsentimiento;
  }
  async reaceptarConsentimiento(): Promise<void> {}
  async confirmarRegistro(): Promise<void> {}
  async cancelarRegistroProvisional(): Promise<boolean> {
    return true;
  }
}

describe('Flujo de consentimiento y revisión', () => {
  it('registra consentimiento y línea base después de crear la cuenta', async () => {
    const user = Usuario.crear(
      new CorreoElectronico('student@example.com'),
      'hash',
    );
    const registration = new RegistrationRepositoryFake();
    const useCase = new CompletarConsentimientoLineaBaseUseCase(
      new RegistrationUserRepository(user),
      registration,
    );

    const output = await useCase.execute(user.getId(), {
      idConsentimiento: registration.consent!.id,
      consentimientoAceptado: true,
      registroConsumoAutorizado: true,
      lineaBase: baseData,
    });

    expect(registration.completed).toBe(true);
    expect(output.estadoRegistro).toBe(EstadoRegistro.PENDIENTE_REVISION);
  });

  it('invalida el consentimiento al modificar la edad', async () => {
    const user = Usuario.crear(
      new CorreoElectronico('student@example.com'),
      'hash',
    );
    const registration = new RegistrationRepositoryFake();
    registration.revision = {
      idUsuario: user.getId(),
      correoElectronico: user.getCorreo().getValue(),
      estadoRegistro: EstadoRegistro.PENDIENTE_REVISION,
      consentimientoVigente: true,
      versionConsentimiento: '1.0.0',
      lineaBase: LineaBase.crear(user.getId(), baseData),
    };
    const useCase = new ActualizarRevisionRegistroUseCase(registration);

    const output = await useCase.execute(user.getId(), { edad: 21 });

    expect(registration.updatedFields).toEqual(['edad']);
    expect(registration.invalidated).toBe(true);
    expect(output.requiereNuevoConsentimiento).toBe(true);
    expect(output.estadoRegistro).toBe(EstadoRegistro.PENDIENTE_CONSENTIMIENTO);
  });
});
