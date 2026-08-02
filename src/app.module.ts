import { Module } from '@nestjs/common';
import { UsersModule } from './modules/usuarios/users.module';
import {PrismaModule} from '../prisma/prisma.module'
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [UsersModule, PrismaModule, ScheduleModule.forRoot()],

})
export class AppModule {}
