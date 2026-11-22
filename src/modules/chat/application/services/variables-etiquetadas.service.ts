import { Injectable } from '@nestjs/common';
import { VariablesEtiquetadasRepository } from '../../domain/repositories/variables-etiquetadas.repository';
import { PENDIENTE_PERFIL } from '../ports/perfil-clinico-vigente.port';
import {
  VariablesEtiquetadasPort,
  VariablesEtiquetadasSesion,
} from '../ports/variables-etiquetadas.port';

/**
 * RF-30B → RF-53: consolida en un payload por sesión las variables
 * etiquetadas. El perfil, el estado y la versión son los de la última.
 */
@Injectable()
export class VariablesEtiquetadasService implements VariablesEtiquetadasPort {
  constructor(private readonly repository: VariablesEtiquetadasRepository) {}

  async listarPorSesion(
    idSesion: string,
  ): Promise<VariablesEtiquetadasSesion | null> {
    const etiquetas = await this.repository.listarPorSesion(
      idSesion.toLowerCase(),
    );
    if (etiquetas.length === 0) return null;
    const ultima = etiquetas.reduce((a, b) =>
      b.secuencia > a.secuencia ? b : a,
    );
    return {
      id_usuario: ultima.idUsuario,
      id_sesion: ultima.idSesion,
      id_interaccion: ultima.idInteraccion,
      timestamp_interaccion: ultima.timestampInteraccion.toISOString(),
      modalidad_intervencion: ultima.modalidad,
      perfil_clinico: {
        tipo_dependencia: ultima.perfil.tipoDependencia ?? PENDIENTE_PERFIL,
        tipo_craving: ultima.perfil.tipoCraving ?? PENDIENTE_PERFIL,
      },
      variables_sesion: [...etiquetas]
        .sort((a, b) => a.secuencia - b.secuencia)
        .flatMap((etiqueta) =>
          etiqueta.elementos.map((elemento) => ({
            codigo: etiqueta.codigoVariable,
            valor: elemento.valor,
            etiqueta: elemento.etiqueta,
          })),
        ),
      estado_etiquetado: ultima.estado,
      version_taxonomia: ultima.versionTaxonomia,
    };
  }
}
