import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RolesGuard } from '../../shared/presentation/guards/role-guard';
import { UsersModule } from '../usuarios/users.module';
import {
  BitacoraRepository,
  ColaAuditoriaPort,
} from './application/ports/auditoria.port';
import { AuditoriaService } from './application/services/auditoria.service';
import { ConsultarBitacoraUseCase } from './application/use-cases/consultar-bitacora.use-case';
import { BullMqAuditoriaAdapter } from './infrastructure/messaging/bullmq-auditoria.adapter';
import { PrismaBitacoraRepository } from './infrastructure/persistence/prisma-bitacora.repository';
import { BitacoraController } from './presentation/controllers/bitacora.controller';
import { AccesoBitacoraGuard } from './presentation/guards/acceso-bitacora.guard';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [BitacoraController],
  providers: [
    AuditoriaService,
    ConsultarBitacoraUseCase,
    AccesoBitacoraGuard,
    RolesGuard,
    { provide: BitacoraRepository, useClass: PrismaBitacoraRepository },
    { provide: ColaAuditoriaPort, useClass: BullMqAuditoriaAdapter },
  ],
  exports: [AuditoriaService],
})
export class AdministrativoModule {}
