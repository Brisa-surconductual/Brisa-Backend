import { Injectable } from "@nestjs/common";
import { UsuarioRepository } from "../../domain/repositories/user.repository";
import { PrismaService } from "../../../../../prisma/prisma.service"
import { Usuario } from "../../domain/entities/usuarios.entity";
import { LineaBase } from "../../domain/entities/linea-bases.entity";
import { UsuarioMapper } from "../mappers/user.mapper";
import { LineaBaseMapper } from "../mappers/linea-base.mapper";


@Injectable()
export class PrismaUsuarioRepository  implements UsuarioRepository {
    constructor(
        private readonly prisma: PrismaService
    ) {}

        async buscarPorCorreo(correo: string): Promise<Usuario | null> {

        const usuario = await this.prisma.usuarios.findUnique({
                where: {
                    correo_electronico: correo,
                },
            });

            if (!usuario) {
                return null;
            }

            return UsuarioMapper.toDomain(usuario);
        }

        async crear(
            usuario: Usuario,
            lineaBase: LineaBase,
        ): Promise<void> {

            await this.prisma.$transaction(async (tx) => {

                await tx.usuarios.create({
                    data: UsuarioMapper.toPrisma(usuario) as any,
                });

                await tx.linea_base.create({
                    data: LineaBaseMapper.toPrisma(lineaBase) as any,
                });

            });

        }
}