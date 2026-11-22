import { Injectable } from '@nestjs/common';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { ValidarVariableNodoPolicy } from '../../domain/policies/validar-variable-nodo.policy';
import { validarVariableNodo } from '../../domain/policies/variable-nodo';
import { TaxonomiaVariablesRepository } from '../../domain/repositories/taxonomia-variables.repository';

/**
 * RF-30B: valida la variable taxonómica que marca un nodo contra la
 * taxonomía vigente. Se usa al crear, editar y publicar.
 */
@Injectable()
export class VariableNodoService {
  private readonly policy = new ValidarVariableNodoPolicy();

  constructor(private readonly taxonomia: TaxonomiaVariablesRepository) {}

  async validar(nodo: NodoConversacional): Promise<void> {
    const marca = validarVariableNodo(nodo.contenido);
    if (marca === null) return;
    const variable = await this.taxonomia.buscarPorCodigo(marca.codigo);
    this.policy.validar(nodo, marca.codigo, variable);
  }

  async validarTodos(nodos: readonly NodoConversacional[]): Promise<void> {
    for (const nodo of nodos) await this.validar(nodo);
  }
}
