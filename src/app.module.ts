import { Module } from '@nestjs/common';
import { UsersModule } from './modules/usuarios/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronogramaModule } from './modules/cronograma/cronograma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthController } from './shared/presentation/controllers/health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    UsersModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ global: true }),
    CronogramaModule,
  ],
})
export class AppModule {}
