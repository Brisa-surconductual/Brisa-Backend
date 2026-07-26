import { Module } from '@nestjs/common';
import { UsersModule } from './modules/usuarios/users.module';
@Module({
  imports: [UsersModule],
})
export class AppModule {}
