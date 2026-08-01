import { Module } from '@nestjs/common';
import {UsuarioInfraestructureProviders} from './infrastructure/usuario.providers';
import {UsuarioAplicationProviders} from './aplication/usuario.providers';
import { PrismaService } from '../../../prisma/prisma.service';
import {UsuariosController} from './presentation/controllers/usuarios.controller';
@Module({
    
    controllers: [UsuariosController],

    providers: [
        PrismaService,
        ...UsuarioAplicationProviders,
        ...UsuarioInfraestructureProviders
    ]

})

export class UsersModule {}