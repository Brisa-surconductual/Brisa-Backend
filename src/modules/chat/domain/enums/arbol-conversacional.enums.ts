export enum EstadoFlujoConversacional {
  BORRADOR = 'BORRADOR',
  PUBLICADO = 'PUBLICADO',
  ARCHIVADO = 'ARCHIVADO',
}

export enum ModalidadConversacional {
  GRUPAL = 'GRUPAL',
  PERSONALIZADA = 'PERSONALIZADA',
}

export enum TipoDependenciaClinica {
  ABSTINENCIA_FISICA = 'ABSTINENCIA_FISICA',
  TOLERANCIA = 'TOLERANCIA',
}

export enum TipoCravingClinico {
  POSITIVO = 'POSITIVO',
  NEGATIVO = 'NEGATIVO',
}

export enum OperadorCondicion {
  IGUALDAD = 'IGUALDAD',
  RANGO = 'RANGO',
  CATEGORIA = 'CATEGORIA',
}

export enum TipoDatoValidacion {
  TEXTO = 'TEXTO',
  NUMERICO = 'NUMERICO',
  FECHA = 'FECHA',
  SELECCION = 'SELECCION',
}
