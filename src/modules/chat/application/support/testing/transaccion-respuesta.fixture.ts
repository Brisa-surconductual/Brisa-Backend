import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { VariableEtiquetada } from '../../../domain/repositories/variables-etiquetadas.repository';
import { RegistroDeRespuesta } from '../../ports/procesar-respuesta.port';
import { variablesSeed } from './taxonomia-variables.fixture';
import {
  idsRespuesta as ids,
  nodoRespuesta,
  transicionRespuesta,
} from './respuesta-fixtures';

export function transaccionRespuestaPrueba() {
  const sesion = new SesionConversacional(
    ids.sesion,
    ids.usuario,
    ids.flujo,
    1,
    ModalidadConversacional.GRUPAL,
    null,
    null,
    ids.nodo,
    'ACTIVA',
    new Date(),
    new Date(),
  );
  return {
    contexto: {
      bloquearSesion: jest.fn().mockResolvedValue(sesion),
      estadoIntervencionSos: jest.fn().mockResolvedValue(null),
      buscarNodo: jest.fn().mockImplementation((id: string) =>
        Promise.resolve(
          nodoRespuesta(
            // El rango básico vive en la entrada del nodo (RF-25).
            id === ids.nodo ? { tipo: 'NUMERICO', min: 0, max: 10 } : null,
            id === ids.nodo ? 'PREGUNTA' : 'MENSAJE',
            id,
          ),
        ),
      ),
      buscarTransiciones: jest.fn().mockResolvedValue([transicionRespuesta()]),
      esTerminal: jest.fn().mockResolvedValue(false),
      siguienteNodoImplicito: jest.fn().mockResolvedValue(null),
    },
    registro: {
      buscarResultado: jest.fn().mockResolvedValue(null),
      ultimaSecuencia: jest.fn().mockResolvedValue(0),
      guardar: jest
        .fn<Promise<void>, [RegistroDeRespuesta]>()
        .mockResolvedValue(undefined),
    },
    estado: {
      insertarPaso: jest.fn().mockResolvedValue(undefined),
      avanzarDesdeOrigen: jest.fn().mockResolvedValue(true),
      actualizarEstado: jest.fn().mockResolvedValue(undefined),
      validarHistorial: jest.fn().mockResolvedValue(true),
    },
    perfil: {
      capturarDimension: jest.fn().mockResolvedValue({
        aplicado: true,
        dimension: 'TIPO_DEPENDENCIA',
        valorVigente: 'ABSTINENCIA_FISICA',
        perfilCompleto: false,
      }),
    },
    variables: {
      buscarVariable: jest.fn((codigo: string) =>
        Promise.resolve(
          Object.values(variablesSeed).find((v) => v.codigo === codigo) ?? null,
        ),
      ),
      versionActual: jest.fn().mockResolvedValue('1.0'),
      snapshotPerfil: jest
        .fn()
        .mockResolvedValue({ tipoDependencia: null, tipoCraving: null }),
      registrar: jest
        .fn<Promise<void>, [VariableEtiquetada]>()
        .mockResolvedValue(undefined),
    },
  };
}
