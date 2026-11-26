import { Injectable } from '@nestjs/common';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import {
  DisponibilidadNodo,
  disponibilidadDesde,
  NODO_DISPONIBLE,
  requiereHabilitacion,
} from '../../domain/policies/habilitacion-nodo.policy';
import { HabilitacionContenidoChatRepository } from '../../domain/repositories/habilitacion-contenido-chat.repository';

/**
 * RF-24 / RF-22: decide si el estudiante ya puede responder un nodo según su
 * cronograma. Si la consulta al cronograma falla, el error se propaga: nunca
 * se habilita por defecto.
 */
@Injectable()
export class HabilitacionNodoService {
  constructor(
    private readonly habilitacion: HabilitacionContenidoChatRepository,
  ) {}

  async evaluar(
    idUsuario: string,
    nodo: NodoConversacional,
  ): Promise<DisponibilidadNodo> {
    if (!requiereHabilitacion(nodo)) return NODO_DISPONIBLE;
    return disponibilidadDesde(
      await this.habilitacion.consultar(idUsuario, nodo.idContenido as string),
    );
  }
}
