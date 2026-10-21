import { Test } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NestRegistroEstudiantePublisher } from '../../../usuarios/infrastructure/messaging/nest-registro-estudiante.publisher';
import { InicializarCronogramaUsuarioUseCase } from '../../application/use-cases/cronograma/inicializar-cronograma-usuario.use-case';
import { InicializarCronogramaRegistroListener } from './inicializar-cronograma-registro.listener';

describe('Integración de eventos de registro en Nest', () => {
  it('conecta el publicador con el listener del módulo y espera su ejecución', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        NestRegistroEstudiantePublisher,
        InicializarCronogramaRegistroListener,
        { provide: InicializarCronogramaUsuarioUseCase, useValue: { execute } },
      ],
    }).compile();
    const app = module.createNestApplication();
    try {
      await app.init();
      await module
        .get(NestRegistroEstudiantePublisher)
        .publicar('usuario-recien-creado');
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith('usuario-recien-creado');
    } finally {
      await app.close();
    }
  });
});
