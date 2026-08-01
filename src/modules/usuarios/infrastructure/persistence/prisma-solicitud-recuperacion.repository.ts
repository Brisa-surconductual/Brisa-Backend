import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { SolicitudRecuperacion } from "../../domain/entities/solicitud-recuperacion.entity";
import { SolicitudRecuperacionMapper } from "../mappers/solicitud-recuperacion.mapper";


@Injectable()
export class PrismaSolicitudRecuperacionRepository  {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async crear(solicitudRecuperacion: SolicitudRecuperacion): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            await tx.solicitudes_recuperacion.create({

                data: SolicitudRecuperacionMapper.toPrisma(solicitudRecuperacion) as any,

            })

        })
    }

    async buscarIdUsuarioPorCorreo(correoElectronico: string): Promise<string | null> {
                const usuario = await this.prisma.usuarios.findUnique({
            where: {
                correo_electronico: correoElectronico,
            },
            select: {
                id_usuario: true,
            },
        });

        return usuario?.id_usuario ?? null;
    }

}