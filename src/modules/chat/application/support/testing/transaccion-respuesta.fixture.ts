import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { RegistroDeRespuesta } from '../../ports/procesar-respuesta.port';
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
      buscarNodo: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(
            nodoRespuesta(
              id === ids.nodo ? { tipo: 'NUMERICO' } : null,
              id === ids.nodo ? 'PREGUNTA' : 'MENSAJE',
              id,
            ),
          ),
        ),
      buscarTransiciones: jest.fn().mockResolvedValue([transicionRespuesta()]),
      tieneSalidas: jest.fn().mockResolvedValue(true),
    },
    registro: {
      buscarResultado: jest.fn().mockResolvedValue(null),
      guardar: jest
        .fn<Promise<void>, [RegistroDeRespuesta]>()
        .mockResolvedValue(undefined),
    },
    perfil: {
      capturarDimension: jest.fn().mockResolvedValue({
        aplicado: true,
        dimension: 'TIPO_DEPENDENCIA',
        valorVigente: 'ABSTINENCIA_FISICA',
        perfilCompleto: false,
      }),
    },
  };
}
