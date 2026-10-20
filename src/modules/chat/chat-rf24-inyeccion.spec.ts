import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { IniciarOReanudarSesionUseCase } from './application/use-cases/iniciar-o-reanudar-sesion.use-case';
import { ChatModule } from './chat.module';
import { SesionesConversacionalesController } from './presentation/sesiones-conversacionales.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

jest.mock('../cronograma/presentation/cronograma.providers', () => ({
  CronogramaPresentationProviders: [],
}));

describe('ChatModule - inyección de dependencias RF-24', () => {
  it('resuelve el caso de uso y el controlador', async () => {
    const modulo = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ global: true }),
        ScheduleModule.forRoot(),
        ChatModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    try {
      expect(
        modulo.get(IniciarOReanudarSesionUseCase, {
          strict: false,
        }),
      ).toBeDefined();

      expect(
        modulo.get(SesionesConversacionalesController, {
          strict: false,
        }),
      ).toBeDefined();
    } finally {
      await modulo.close();
    }
  });
});
