import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../enums/perfil-clinico.enum';

/** Perfil clínico del usuario tal como lo necesita el chat para elegir su árbol. */
export class PerfilClinicoConversacional {
  constructor(
    readonly tipoDependencia: TipoDependenciaClinica | null,
    readonly tipoCraving: TipoCravingClinico | null,
  ) {}

  /** El perfil está completo cuando ambas dimensiones están registradas. */
  get completo(): boolean {
    return this.tipoDependencia !== null && this.tipoCraving !== null;
  }
}
