import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { TipoDependenciaClinica } from '../../domain/enums/perfil-clinico.enum';
import { EstadoEtiquetado } from '../../domain/enums/tipo-valor-variable.enum';
import { VariableEtiquetada } from '../../domain/repositories/variables-etiquetadas.repository';
import { VariablesEtiquetadasService } from './variables-etiquetadas.service';

const sesion = '30b00000-0000-4000-8000-0000000000b1';
const usuario = '30b00000-0000-4000-8000-0000000000b2';

const etiqueta = (
  cambios: Partial<VariableEtiquetada> & { secuencia: number },
): VariableEtiquetada => ({
  idInteraccion: `interaccion-${cambios.secuencia}`,
  idSesion: sesion,
  idUsuario: usuario,
  idNodo: 'nodo',
  idVariable: 'variable',
  codigoVariable: 'NIVEL_CRAVING',
  valor: 4,
  elementos: [{ valor: 4, etiqueta: 'CRAVING_MODERADO' }],
  modalidad: ModalidadConversacional.GRUPAL,
  perfil: { tipoDependencia: null, tipoCraving: null },
  estado: EstadoEtiquetado.PENDIENTE_PERFIL,
  versionTaxonomia: '1.0',
  timestampInteraccion: new Date('2026-11-22T19:40:12.000Z'),
  ...cambios,
});

describe('RF-30B → RF-53 VariablesEtiquetadasService', () => {
  const repository = { listarPorSesion: jest.fn() };
  const servicio = new VariablesEtiquetadasService(repository);

  beforeEach(() => jest.resetAllMocks());

  it('null si la sesión no tiene variables etiquetadas', async () => {
    repository.listarPorSesion.mockResolvedValue([]);
    await expect(
      servicio.listarPorSesion(sesion.toUpperCase()),
    ).resolves.toBeNull();
    expect(repository.listarPorSesion).toHaveBeenCalledWith(sesion);
  });

  it('consolida un payload por sesión con PENDIENTE_PERFIL', async () => {
    repository.listarPorSesion.mockResolvedValue([etiqueta({ secuencia: 3 })]);

    await expect(servicio.listarPorSesion(sesion)).resolves.toEqual({
      id_usuario: usuario,
      id_sesion: sesion,
      id_interaccion: 'interaccion-3',
      timestamp_interaccion: '2026-11-22T19:40:12.000Z',
      modalidad_intervencion: 'GRUPAL',
      perfil_clinico: {
        tipo_dependencia: 'PENDIENTE_PERFIL',
        tipo_craving: 'PENDIENTE_PERFIL',
      },
      variables_sesion: [
        { codigo: 'NIVEL_CRAVING', valor: 4, etiqueta: 'CRAVING_MODERADO' },
      ],
      estado_etiquetado: 'PENDIENTE_PERFIL',
      version_taxonomia: '1.0',
    });
  });

  it('ordena por secuencia, aplana multiselecciones y toma perfil y versión de la última', async () => {
    repository.listarPorSesion.mockResolvedValue([
      etiqueta({
        secuencia: 7,
        codigoVariable: 'CONTEXTO_EMOCIONAL',
        valor: ['ANSIEDAD', 'ESTRES'],
        elementos: [
          { valor: 'ANSIEDAD', etiqueta: 'ANSIEDAD' },
          { valor: 'ESTRES', etiqueta: 'ESTRES' },
        ],
        perfil: {
          tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
          tipoCraving: null,
        },
        versionTaxonomia: '1.2',
        timestampInteraccion: new Date('2026-11-22T20:00:00.000Z'),
      }),
      etiqueta({ secuencia: 2 }),
    ]);

    const payload = await servicio.listarPorSesion(sesion);

    expect(payload).toMatchObject({
      id_interaccion: 'interaccion-7',
      timestamp_interaccion: '2026-11-22T20:00:00.000Z',
      perfil_clinico: {
        tipo_dependencia: 'TOLERANCIA',
        tipo_craving: 'PENDIENTE_PERFIL',
      },
      version_taxonomia: '1.2',
      variables_sesion: [
        { codigo: 'NIVEL_CRAVING', valor: 4, etiqueta: 'CRAVING_MODERADO' },
        {
          codigo: 'CONTEXTO_EMOCIONAL',
          valor: 'ANSIEDAD',
          etiqueta: 'ANSIEDAD',
        },
        { codigo: 'CONTEXTO_EMOCIONAL', valor: 'ESTRES', etiqueta: 'ESTRES' },
      ],
    });
  });
});
