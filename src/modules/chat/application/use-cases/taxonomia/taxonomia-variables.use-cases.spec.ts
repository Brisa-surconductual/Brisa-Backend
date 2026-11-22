import { VariableTaxonomia } from '../../../domain/entities/taxonomia/variable-taxonomia.entity';
import { AccionAuditoriaArbol } from '../../../domain/enums/accion-auditoria-arbol.enum';
import { TipoEntradaRespuesta as Entrada } from '../../../domain/enums/tipo-entrada-respuesta.enum';
import { TipoValorVariable as Tipo } from '../../../domain/enums/tipo-valor-variable.enum';
import {
  DefinicionVariableInvalidaException,
  VariableDuplicadaException,
  VariableEnUsoPublicadoException,
  VariableNoEncontradaException,
} from '../../../domain/exceptions/taxonomia.exceptions';
import {
  TaxonomiaVariablesRepository,
  TaxonomiaVariablesTransaccion,
} from '../../../domain/repositories/taxonomia-variables.repository';
import { VersionTaxonomia } from '../../../domain/value-objects/version-taxonomia.vo';
import { CrearVariableTaxonomiaDtoRequest } from '../../dto/taxonomia/taxonomia-variables.dto-request';
import { variablesSeed } from '../../support/testing/taxonomia-variables.fixture';
import { CambiarEstadoVariableTaxonomiaUseCase } from './cambiar-estado-variable-taxonomia.use-case';
import { ConsultarTaxonomiaVariablesUseCase } from './consultar-taxonomia-variables.use-case';
import { CrearVariableTaxonomiaUseCase } from './crear-variable-taxonomia.use-case';

const actor = '30b00000-0000-4000-8000-0000000000aa';

function transaccionPrueba() {
  return {
    bloquearPorCodigo: jest.fn<Promise<VariableTaxonomia | null>, [string]>(),
    existeCodigo: jest
      .fn<Promise<boolean>, [string]>()
      .mockResolvedValue(false),
    estaEnUsoPublicado: jest
      .fn<Promise<boolean>, [string]>()
      .mockResolvedValue(false),
    insertar: jest
      .fn<Promise<VariableTaxonomia>, [VariableTaxonomia, string]>()
      .mockImplementation((v) => Promise.resolve(v.conId('nuevo-id'))),
    actualizarEstado: jest
      .fn<Promise<void>, [VariableTaxonomia]>()
      .mockResolvedValue(undefined),
    versionActual: jest.fn().mockResolvedValue(VersionTaxonomia.de('1.3')),
    registrarVersion: jest.fn().mockResolvedValue(VersionTaxonomia.de('1.4')),
  } satisfies TaxonomiaVariablesTransaccion;
}

function repositorioPrueba(tx: TaxonomiaVariablesTransaccion) {
  return {
    versionActual: jest.fn().mockResolvedValue(VersionTaxonomia.de('1.0')),
    listar: jest.fn(),
    buscarPorCodigo: jest.fn(),
    ejecutar: jest.fn(
      <T>(op: (t: TaxonomiaVariablesTransaccion) => Promise<T>) => op(tx),
    ),
  };
}

describe('RF-30B ConsultarTaxonomiaVariablesUseCase', () => {
  it('devuelve la versión global y las variables con su uso publicado', async () => {
    const repo = repositorioPrueba(transaccionPrueba());
    repo.listar.mockResolvedValue([
      { variable: variablesSeed.nivelCraving, enUsoPublicado: true },
    ]);
    const casoDeUso = new ConsultarTaxonomiaVariablesUseCase(
      repo as unknown as TaxonomiaVariablesRepository,
    );

    const respuesta = await casoDeUso.execute();

    expect(repo.listar).toHaveBeenCalledWith(false);
    expect(respuesta).toEqual({
      version: '1.0',
      variables: [
        {
          codigo: 'NIVEL_CRAVING',
          nombre: 'Nivel de craving',
          descripcion: null,
          tipo_valor: 'ENTERO',
          valores: null,
          tipos_entrada_permitidos: ['ESCALA', 'NUMERICO'],
          etiquetas: variablesSeed.nivelCraving.etiquetas,
          habilitada: true,
          en_uso_publicado: true,
        },
      ],
    });
  });
});

describe('RF-30B CrearVariableTaxonomiaUseCase', () => {
  const dto: CrearVariableTaxonomiaDtoRequest = {
    codigo: 'HORAS_SUENO',
    nombre: 'Horas de sueño',
    tipo_valor: Tipo.ENTERO,
    tipos_entrada_permitidos: [Entrada.NUMERICO],
    etiquetas: [{ min: 0, max: null, etiqueta: 'HORAS' }],
  };

  it('crea, sube la versión y audita en la misma transacción', async () => {
    const tx = transaccionPrueba();
    const casoDeUso = new CrearVariableTaxonomiaUseCase(
      repositorioPrueba(tx) as unknown as TaxonomiaVariablesRepository,
    );

    const respuesta = await casoDeUso.execute(dto, actor);

    expect(tx.insertar).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: 'HORAS_SUENO', habilitada: true }),
      actor,
    );
    expect(tx.registrarVersion).toHaveBeenCalledWith(
      AccionAuditoriaArbol.CREAR_VARIABLE_TAXONOMIA,
      expect.objectContaining({ idVariable: 'nuevo-id' }),
      actor,
    );
    expect(respuesta).toMatchObject({
      version: '1.4',
      variable: { codigo: 'HORAS_SUENO', habilitada: true },
    });
  });

  it('409 si el código ya existe', async () => {
    const tx = transaccionPrueba();
    tx.existeCodigo.mockResolvedValue(true);
    const casoDeUso = new CrearVariableTaxonomiaUseCase(
      repositorioPrueba(tx) as unknown as TaxonomiaVariablesRepository,
    );

    await expect(casoDeUso.execute(dto, actor)).rejects.toBeInstanceOf(
      VariableDuplicadaException,
    );
    expect(tx.insertar).not.toHaveBeenCalled();
  });

  it('422 con una definición incoherente, sin abrir transacción', async () => {
    const repo = repositorioPrueba(transaccionPrueba());
    const casoDeUso = new CrearVariableTaxonomiaUseCase(
      repo as unknown as TaxonomiaVariablesRepository,
    );

    await expect(
      casoDeUso.execute(
        { ...dto, tipos_entrada_permitidos: [Entrada.OPCION_UNICA] },
        actor,
      ),
    ).rejects.toBeInstanceOf(DefinicionVariableInvalidaException);
    expect(repo.ejecutar).not.toHaveBeenCalled();
  });
});

describe('RF-30B CambiarEstadoVariableTaxonomiaUseCase', () => {
  const crear = (tx: ReturnType<typeof transaccionPrueba>) =>
    new CambiarEstadoVariableTaxonomiaUseCase(
      repositorioPrueba(tx) as unknown as TaxonomiaVariablesRepository,
    );

  it('deshabilita una variable sin uso publicado y sube la versión', async () => {
    const tx = transaccionPrueba();
    tx.bloquearPorCodigo.mockResolvedValue(variablesSeed.nivelCraving);

    const respuesta = await crear(tx).execute('NIVEL_CRAVING', false, actor);

    expect(tx.actualizarEstado).toHaveBeenCalledWith(
      expect.objectContaining({ habilitada: false }),
    );
    expect(tx.registrarVersion).toHaveBeenCalledWith(
      AccionAuditoriaArbol.DESHABILITAR_VARIABLE_TAXONOMIA,
      expect.anything(),
      actor,
    );
    expect(respuesta).toMatchObject({
      version: '1.4',
      variable: { habilitada: false },
    });
  });

  it('409 si un flujo publicado la usa, sin escribir', async () => {
    const tx = transaccionPrueba();
    tx.bloquearPorCodigo.mockResolvedValue(variablesSeed.nivelCraving);
    tx.estaEnUsoPublicado.mockResolvedValue(true);

    await expect(
      crear(tx).execute('NIVEL_CRAVING', false, actor),
    ).rejects.toBeInstanceOf(VariableEnUsoPublicadoException);
    expect(tx.actualizarEstado).not.toHaveBeenCalled();
    expect(tx.registrarVersion).not.toHaveBeenCalled();
  });

  it('habilita sin consultar el uso publicado', async () => {
    const tx = transaccionPrueba();
    tx.bloquearPorCodigo.mockResolvedValue(
      variablesSeed.nivelCraving.deshabilitar(false),
    );

    await crear(tx).execute('NIVEL_CRAVING', true, actor);

    expect(tx.estaEnUsoPublicado).not.toHaveBeenCalled();
    expect(tx.registrarVersion).toHaveBeenCalledWith(
      AccionAuditoriaArbol.HABILITAR_VARIABLE_TAXONOMIA,
      expect.objectContaining({ habilitada: true }),
      actor,
    );
  });

  it('pedir el estado actual no escribe ni sube la versión', async () => {
    const tx = transaccionPrueba();
    tx.bloquearPorCodigo.mockResolvedValue(variablesSeed.nivelCraving);

    const respuesta = await crear(tx).execute('NIVEL_CRAVING', true, actor);

    expect(tx.actualizarEstado).not.toHaveBeenCalled();
    expect(tx.registrarVersion).not.toHaveBeenCalled();
    expect(respuesta.version).toBe('1.3');
  });

  it('404 si la variable no existe', async () => {
    const tx = transaccionPrueba();
    tx.bloquearPorCodigo.mockResolvedValue(null);

    await expect(
      crear(tx).execute('NO_EXISTE', false, actor),
    ).rejects.toBeInstanceOf(VariableNoEncontradaException);
  });
});
