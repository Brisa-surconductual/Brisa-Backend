import { Module } from '@nestjs/common';
import { UsersModule } from './modules/usuarios/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronogramaModule } from './modules/cronograma/cronograma.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    CronogramaModule,
  ],
})
export class AppModule {}
