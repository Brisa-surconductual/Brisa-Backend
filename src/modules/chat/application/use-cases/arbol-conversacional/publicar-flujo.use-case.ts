import { Injectable } from '@nestjs/common';
import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { DimensionPerfilClinico } from '../../../domain/enums/perfil-clinico.enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  CoberturaTransicionesIncompletaException,
  FlujoConversacionalNoEncontradoException,
  FlujoGrupalPublicadoExistenteException,
  FlujoPersonalizadoArchivadoException,
  GrafoInvalidoException,
  NodoCapturaPerfilInvalidoException,
} from '../../../domain/exceptions';
import { extraerDimensionCapturaPerfil } from '../../../domain/policies/dimension-captura-perfil';
import { opcionesDelNodo } from '../../../domain/policies/regla-por-tipo-entrada';
import { valoresPermitidosCoincidenConDominio } from '../../../domain/policies/valores-permitidos-captura-perfil';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-25 / RF-25C: publica un borrador cuya estructura sea válida.
 * En modalidad personalizada archiva automáticamente el publicado anterior de
 * la misma combinación de perfil; en grupal solo puede haber un publicado.
 */
@Injectable()
export class PublicarFlujoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();

      const esPersonalizado =
        arbol.flujo.modalidad === ModalidadConversacional.PERSONALIZADA;
      if (esPersonalizado && arbol.flujo.estaArchivado) {
        throw new FlujoPersonalizadoArchivadoException();
      }
      const ahora = new Date();
      const publicado = arbol.flujo.publicar(ahora);

      const diagnostico = arbol.diagnosticarEstructura();
      if (
        diagnostico.sin_nodo_inicial ||
        diagnostico.nodos_huerfanos.length > 0 ||
        diagnostico.ciclos.length > 0
      ) {
        throw new GrafoInvalidoException(diagnostico);
      }

      const cobertura = arbol.diagnosticarCobertura();
      if (cobertura.nodos_sin_cobertura.length > 0) {
        throw new CoberturaTransicionesIncompletaException(cobertura);
      }

      if (esPersonalizado) {
        const perfil = publicado.perfilClinico();
        const anterior = await this.repository.buscarPublicadoPersonalizado(
          perfil.tipoDependencia,
          perfil.tipoCraving,
        );
        // El anterior se archiva primero para respetar el índice de publicado único.
        await this.repository.guardarFlujos(
          anterior === null
            ? [publicado]
            : [anterior.archivar(ahora), publicado],
          idActor,
        );
      } else {
        const diagnosticoPerfil = arbol.diagnosticarCapturaPerfil();
        const dimensionesValoresInvalidos =
          diagnosticoPerfil.dimensiones_ausentes.length === 0 &&
          diagnosticoPerfil.dimensiones_duplicadas.length === 0
            ? this.dimensionesConValoresInvalidos(arbol)
            : [];
        if (
          diagnosticoPerfil.dimensiones_ausentes.length > 0 ||
          diagnosticoPerfil.dimensiones_duplicadas.length > 0 ||
          dimensionesValoresInvalidos.length > 0
        ) {
          throw new NodoCapturaPerfilInvalidoException({
            ...diagnosticoPerfil,
            dimensiones_valores_invalidos: dimensionesValoresInvalidos,
          });
        }
        if ((await this.repository.buscarPublicadoGrupal()) !== null) {
          throw new FlujoGrupalPublicadoExistenteException();
        }
        await this.repository.guardarFlujo(publicado, idActor);
      }
      return FlujoConversacionalDtoResponse.crear(publicado);
    });
  }

  /**
   * RF-25: las opciones de cada nodo de captura deben ser exactamente el
   * dominio clínico de su dimensión (las reglas de sus transiciones solo
   * pueden elegir entre esas opciones, y la cobertura exige un camino por cada una).
   */
  private dimensionesConValoresInvalidos(
    arbol: ArbolConversacional,
  ): DimensionPerfilClinico[] {
    return arbol.nodos.flatMap((nodo) => {
      const dimension = extraerDimensionCapturaPerfil(nodo.contenido);
      if (dimension === null) return [];
      const entrada = nodo.contenido.entrada;
      const opciones =
        typeof entrada === 'object' && entrada !== null
          ? opcionesDelNodo(entrada as Record<string, unknown>)
          : [];
      return valoresPermitidosCoincidenConDominio(dimension, opciones)
        ? []
        : [dimension];
    });
  }
}
