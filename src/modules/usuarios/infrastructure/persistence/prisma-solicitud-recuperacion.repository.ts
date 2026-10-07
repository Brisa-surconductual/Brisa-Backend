import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { SolicitudRecuperacion } from "../../domain/entities/solicitud-recuperacion.entity";
import { SolicitudRecuperacionMapper } from "../mappers/solicitud-recuperacion.mapper";
import { EstadoCodigo } from "../../domain/enums/estado-codigo-enum";
import { RecuperacionRepository } from "../../domain/repositories/recuperacion.repository";
import * as bcrypt from "bcrypt";
import { RecoveryCodeHasher } from "../../application/ports/recovery-code-hasher";

@Injectable()
export class PrismaSolicitudRecuperacionRepository implements RecuperacionRepository{
    
    constructor(
        private readonly prisma: PrismaService,
        private readonly recoveryCodeHasher: RecoveryCodeHasher
    ) {}

    async actualizar(solicitud: SolicitudRecuperacion): Promise<void> {
    await this.prisma.solicitudes_recuperacion.update({
        where: {
            id_solicitud: solicitud.idSolicitudRecuperacion,
        },
        data: SolicitudRecuperacionMapper.toPrisma(solicitud),
    });
    }

    async buscarPorCodigo(codigo: string): Promise<SolicitudRecuperacion | null> {
        const codigoHash = await this.recoveryCodeHasher.hash(codigo.toString());

        const solicitud =
            await this.prisma.solicitudes_recuperacion.findFirst({

                where: {
                    codigo_hash: codigoHash,
                    estado_codigo: EstadoCodigo.ACTIVO,
                    fecha_expiracion: {
                        gt: new Date(),
                    },
                },

            });

            return solicitud ? SolicitudRecuperacionMapper.toDomain(solicitud) : null;
        
    }


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


    async expirarCodigosVencidos(): Promise<number> {
    const resultado = await this.prisma.solicitudes_recuperacion.updateMany({
            where: {
                estado_codigo: EstadoCodigo.ACTIVO,
                fecha_expiracion: {
                    lt: new Date(),
                },
            },
            data: {
                estado_codigo: EstadoCodigo.EXPIRADO,
            },
        });

        return resultado.count;
    }


}