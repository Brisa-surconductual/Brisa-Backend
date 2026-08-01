import { UsuarioRepository } from "../domain/repositories/user.repository";
import { PrismaUsuarioRepository } from "./persistence/prisma-usuario.repository";

import {PasswordHasher} from "../aplication/ports/password-hasher";
import {BcryptPasswordHasher} from "./security/bycrptPassword"

export const UsuarioInfraestructureProviders = [

    {

        provide: UsuarioRepository,
        useClass: PrismaUsuarioRepository,

    },

    {

        provide: PasswordHasher,
        useClass: BcryptPasswordHasher,

    }

];