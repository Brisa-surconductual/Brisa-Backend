import { Module } from '@nestjs/common';
import { UsersModule } from './modules/usuarios/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronogramaModule } from './modules/cronograma/cronograma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ global: true }),
    CronogramaModule,
    ChatModule,
  ],
})
export class AppModule {}
