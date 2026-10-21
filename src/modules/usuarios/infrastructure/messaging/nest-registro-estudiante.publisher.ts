import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ESTUDIANTE_REGISTRADO,
  RegistroEstudiantePublisher,
} from '../../application/ports/registro-estudiante.publisher';

@Injectable()
export class NestRegistroEstudiantePublisher extends RegistroEstudiantePublisher {
  constructor(private readonly eventos: EventEmitter2) {
    super();
  }

  async publicar(idUsuario: string): Promise<void> {
    await this.eventos.emitAsync(ESTUDIANTE_REGISTRADO, { idUsuario });
  }
}
