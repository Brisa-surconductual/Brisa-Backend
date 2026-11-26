import { Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  CoberturaTransicionesIncompletaException,
  FlujoConversacionalNoEncontradoException,
  FlujoPersonalizadoArchivadoException,
  FlujoPublicadoUnicoExistenteException,
  FlujoSosInvalidoException,
  GrafoInvalidoException,
  NodoCapturaPerfilInvalidoException,
} from '../../../domain/exceptions';
import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { ModalidadSinPerfil } from '../../../domain/entities/flujo/flujo-conversacional.entity';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';
import { VariableNodoService } from '../../services/variable-nodo.service';

/**
 * RF-25 / RF-25C: publica un borrador cuya estructura sea válida (un nodo
 * inicial, un nodo final, sin huérfanos, callejones ni ciclos).
 * En modalidad personalizada archiva automáticamente el publicado anterior de
 * la misma combinación de perfil; en grupal y SOS (RF-43) solo puede haber
 * un publicado por modalidad.
 */
@Injectable()
export class PublicarFlujoUseCase {
  constructor(
    private readonly repository: ArbolConversacionalRepository,
    private readonly variables: VariableNodoService,
  ) {}

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
        diagnostico.sin_nodo_final ||
        diagnostico.nodos_huerfanos.length > 0 ||
        diagnostico.nodos_sin_salida.length > 0 ||
        diagnostico.ciclos.length > 0
      ) {
        throw new GrafoInvalidoException(diagnostico);
      }

      // RF-30B: ningún nodo publicado captura una variable inexistente o deshabilitada.
      await this.variables.validarTodos(arbol.nodos);

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
        // GRUPAL y SOS: sin perfil clínico y con un único publicado.
        const modalidad = publicado.modalidad as ModalidadSinPerfil;
        if (modalidad === ModalidadConversacional.SOS) {
          this.validarRestriccionesSos(arbol);
        } else {
          this.validarCapturaPerfil(arbol);
        }
        if ((await this.repository.buscarPublicadoUnico(modalidad)) !== null) {
          throw new FlujoPublicadoUnicoExistenteException(modalidad);
        }
        await this.repository.guardarFlujo(publicado, idActor);
      }
      return FlujoConversacionalDtoResponse.crear(publicado);
    });
  }

  /** RF-25 / RF-27B: el árbol grupal captura cada dimensión del perfil. */
  private validarCapturaPerfil(arbol: ArbolConversacional): void {
    const diagnostico = arbol.diagnosticarCapturaPerfil();
    if (
      diagnostico.dimensiones_ausentes.length > 0 ||
      diagnostico.dimensiones_duplicadas.length > 0 ||
      diagnostico.dimensiones_valores_invalidos.length > 0 ||
      diagnostico.dimensiones_valores_faltantes.length > 0
    )
      throw new NodoCapturaPerfilInvalidoException(diagnostico);
  }

  /** RF-43: nodos fijos, sin captura de perfil ni contenido del cronograma. */
  private validarRestriccionesSos(arbol: ArbolConversacional): void {
    const diagnostico = arbol.diagnosticarRestriccionesSos();
    if (
      diagnostico.nodos_con_captura_perfil.length > 0 ||
      diagnostico.nodos_con_contenido_cronograma.length > 0
    )
      throw new FlujoSosInvalidoException(diagnostico);
  }
}
