import { Module } from '@nestjs/common';
import { UsersModule } from './modules/usuarios/users.module';
import {PrismaModule} from '../prisma/prisma.module'
@Module({
  imports: [UsersModule, PrismaModule],

})
export class AppModule {}
