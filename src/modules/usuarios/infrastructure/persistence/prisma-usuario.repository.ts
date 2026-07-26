import { Injectable } from '@nestjs/common';
import { $Enums, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { LineaBaseDatos } from '../../domain/entities/linea-bases.entity';
import { Usuario } from '../../domain/entities/usuarios.entity';
import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';
import { EstadoCodigo } from '../../domain/enums/estado-codigo-enum';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import {
  ConsentimientoNoVigenteException,
  CorreoDuplicadoException,
  EstadoRegistroInvalidoException,
} from '../../domain/exceptions/usuario.exceptions';
import {
  NuevaSolicitudRecuperacion,
  RecuperacionContrasenaRepository,
  SolicitudRecuperacionPersistida,
} from '../../domain/repositories/recuperacion-contrasena.repository';
import {
  ConsentimientoVigente,
  RegistroRepository,
  RevisionRegistro,
} from '../../domain/repositories/registro.repository';
import {
  SesionPersistida,
  SesionRepository,
} from '../../domain/repositories/sesion.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { LineaBaseMapper } from '../mappers/linea-base.mapper';
import { UsuarioMapper } from '../mappers/user.mapper';

@Injectable()
export class PrismaUsuarioRepository
  implements
    UsuarioRepository,
    RegistroRepository,
    SesionRepository,
    RecuperacionContrasenaRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuario: Usuario): Promise<void> {
    try {
      await this.prisma.usuarios.create({
        data: UsuarioMapper.toPrisma(usuario),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new CorreoDuplicadoException();
      }
      throw error;
    }
  }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo_electronico: correo },
    });
    return usuario ? UsuarioMapper.toDomain(usuario) : null;
  }

  async buscarPorId(idUsuario: string): Promise<Usuario | null> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: idUsuario },
    });
    return usuario ? UsuarioMapper.toDomain(usuario) : null;
  }

  async actualizarContrasena(
    idUsuario: string,
    contrasenaHash: string,
  ): Promise<void> {
    await this.prisma.usuarios.update({
      where: { id_usuario: idUsuario },
      data: {
        contrasena_hash: contrasenaHash,
        fecha_actualizacion: new Date(),
      },
    });
  }

  async obtenerConsentimientoVigente(): Promise<ConsentimientoVigente | null> {
    const consentimiento = await this.prisma.consentimientos.findFirst({
      where: { vigente: true },
      orderBy: { version_consentimiento: 'desc' },
    });

    return consentimiento
      ? {
          id: consentimiento.id_consentimiento,
          version: consentimiento.version_consentimiento,
          titulo: consentimiento.titulo,
          urlContenido: consentimiento.url_contenido,
        }
      : null;
  }

  async completarConsentimientoYLineaBase(
    idUsuario: string,
    idConsentimiento: string,
    lineaBase: import('../../domain/entities/linea-bases.entity').LineaBase,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuarios.findUnique({
        where: { id_usuario: idUsuario },
        select: { estado_registro: true, linea_base: true },
      });

      if (
        !usuario ||
        usuario.linea_base ||
        usuario.estado_registro !==
          $Enums.estado_registro_enum.PENDIENTE_CONSENTIMIENTO
      ) {
        throw new EstadoRegistroInvalidoException();
      }

      await tx.aceptaciones_consentimiento.create({
        data: {
          id_usuario: idUsuario,
          id_consentimiento: idConsentimiento,
          tratamiento_datos_aceptado: true,
          registro_consumo_aceptado: true,
          vigente: true,
        },
      });

      await tx.linea_base.create({
        data: LineaBaseMapper.toPrisma(lineaBase),
      });

      await tx.usuarios.update({
        where: { id_usuario: idUsuario },
        data: {
          consentimiendo_aceptado: true,
          registro_consumo_aceptado: true,
          id_consentimiento: idConsentimiento,
          estado_registro: $Enums.estado_registro_enum.PENDIENTE_REVISION,
          fecha_actualizacion: new Date(),
        },
      });
    });
  }

  async obtenerRevision(idUsuario: string): Promise<RevisionRegistro | null> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: idUsuario },
      include: {
        linea_base: true,
        aceptaciones_consentimiento: {
          where: { vigente: true },
          orderBy: { fecha_aceptacion: 'desc' },
          take: 1,
          include: { consentimientos: true },
        },
      },
    });

    if (!usuario?.linea_base) {
      return null;
    }

    const aceptacion = usuario.aceptaciones_consentimiento[0];
    const consentimientoVigente = Boolean(
      aceptacion?.vigente &&
      aceptacion.tratamiento_datos_aceptado &&
      aceptacion.registro_consumo_aceptado &&
      aceptacion.consentimientos.vigente,
    );

    return {
      idUsuario: usuario.id_usuario,
      correoElectronico: usuario.correo_electronico,
      estadoRegistro: usuario.estado_registro as EstadoRegistro,
      consentimientoVigente,
      versionConsentimiento:
        aceptacion?.consentimientos.version_consentimiento ?? null,
      lineaBase: LineaBaseMapper.toDomain(usuario.linea_base),
    };
  }

  async actualizarLineaBase(
    idUsuario: string,
    datos: LineaBaseDatos,
    camposModificados: string[],
    invalidaConsentimiento: boolean,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const actual = await tx.linea_base.findUnique({
        where: { id_usuario: idUsuario },
      });

      if (!actual) {
        throw new EstadoRegistroInvalidoException();
      }

      const datosAnteriores: Prisma.InputJsonObject = {
        ciudad: actual.ciudad,
        entidadEducativa: actual.entidad_educativa,
        programaAcademico: actual.programa_academico,
        semestre: actual.semestre_cursado,
        nivelAcademico: actual.nivel_academico,
        edad: actual.edad,
        fechaInicioConsumo: actual.fecha_inicio_consumo.toISOString(),
        fechaUltimoConsumo: actual.fecha_ultimo_consumo.toISOString(),
        motivoInicioConsumo: actual.motivo_inicio_consumo,
        frecuenciaConsumo: actual.frecuencia_consumo,
      };

      await tx.linea_base_historial.create({
        data: {
          id_linea_base: actual.id_linea_base,
          id_usuario: idUsuario,
          campos_modificados: camposModificados,
          datos_anteriores: datosAnteriores,
        },
      });

      await tx.linea_base.update({
        where: { id_usuario: idUsuario },
        data: {
          ciudad: datos.ciudad,
          entidad_educativa: datos.entidadEducativa,
          programa_academico: datos.programaAcademico,
          semestre_cursado: datos.semestre,
          nivel_academico: datos.nivelAcademico,
          edad: datos.edad,
          fecha_inicio_consumo: datos.fechaInicioConsumo,
          fecha_ultimo_consumo: datos.fechaUltimoConsumo,
          motivo_inicio_consumo: datos.motivoInicioConsumo,
          frecuencia_consumo: datos.frecuenciaConsumo,
          fecha_actualizacion: new Date(),
        },
      });

      if (invalidaConsentimiento) {
        const ahora = new Date();
        await tx.aceptaciones_consentimiento.updateMany({
          where: { id_usuario: idUsuario, vigente: true },
          data: {
            vigente: false,
            fecha_invalidacion: ahora,
            motivo_invalidacion: 'MODIFICACION_DATOS_SENSIBLES',
          },
        });

        await tx.usuarios.update({
          where: { id_usuario: idUsuario },
          data: {
            consentimiendo_aceptado: false,
            registro_consumo_aceptado: false,
            estado_registro:
              $Enums.estado_registro_enum.PENDIENTE_CONSENTIMIENTO,
            fecha_actualizacion: ahora,
          },
        });
      }
    });
  }

  async reaceptarConsentimiento(
    idUsuario: string,
    idConsentimiento: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const ahora = new Date();
      await tx.aceptaciones_consentimiento.updateMany({
        where: { id_usuario: idUsuario, vigente: true },
        data: {
          vigente: false,
          fecha_invalidacion: ahora,
          motivo_invalidacion: 'NUEVA_ACEPTACION',
        },
      });

      await tx.aceptaciones_consentimiento.create({
        data: {
          id_usuario: idUsuario,
          id_consentimiento: idConsentimiento,
          tratamiento_datos_aceptado: true,
          registro_consumo_aceptado: true,
          fecha_aceptacion: ahora,
          vigente: true,
        },
      });

      await tx.usuarios.update({
        where: { id_usuario: idUsuario },
        data: {
          id_consentimiento: idConsentimiento,
          consentimiendo_aceptado: true,
          registro_consumo_aceptado: true,
          estado_registro: $Enums.estado_registro_enum.PENDIENTE_REVISION,
          fecha_actualizacion: ahora,
        },
      });
    });
  }

  async confirmarRegistro(idUsuario: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const aceptacion = await tx.aceptaciones_consentimiento.findFirst({
        where: {
          id_usuario: idUsuario,
          vigente: true,
          tratamiento_datos_aceptado: true,
          registro_consumo_aceptado: true,
          consentimientos: { vigente: true },
        },
      });

      if (!aceptacion) {
        throw new ConsentimientoNoVigenteException();
      }

      const resultado = await tx.usuarios.updateMany({
        where: {
          id_usuario: idUsuario,
          estado_registro: $Enums.estado_registro_enum.PENDIENTE_REVISION,
          linea_base: { isNot: null },
        },
        data: {
          estado_registro: $Enums.estado_registro_enum.REGISTRO_COMPLETO,
          fecha_actualizacion: new Date(),
        },
      });

      if (resultado.count !== 1) {
        throw new EstadoRegistroInvalidoException();
      }
    });
  }

  async cancelarRegistroProvisional(idUsuario: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuarios.findUnique({
        where: { id_usuario: idUsuario },
        include: {
          linea_base: true,
          _count: { select: { aceptaciones_consentimiento: true } },
        },
      });

      if (
        !usuario ||
        usuario.linea_base ||
        usuario._count.aceptaciones_consentimiento > 0 ||
        usuario.estado_registro !==
          $Enums.estado_registro_enum.PENDIENTE_CONSENTIMIENTO
      ) {
        return false;
      }

      await tx.usuarios.delete({ where: { id_usuario: idUsuario } });
      return true;
    });
  }

  async crearSesion(
    idUsuario: string,
    limiteInactividadMinutos: number,
  ): Promise<SesionPersistida> {
    const sesion = await this.prisma.sesiones.create({
      data: {
        id_usuario: idUsuario,
        limite_inactividad_minutos: limiteInactividadMinutos,
        estado_aplicacion: $Enums.estado_aplicacion_enum.ACTIVA,
        activa: true,
      },
    });
    return this.mapSesion(sesion);
  }

  async buscarSesionPorId(idSesion: string): Promise<SesionPersistida | null> {
    const sesion = await this.prisma.sesiones.findUnique({
      where: { id_sesion: idSesion },
    });
    return sesion ? this.mapSesion(sesion) : null;
  }

  async registrarInteraccion(idSesion: string, fecha: Date): Promise<void> {
    await this.prisma.sesiones.updateMany({
      where: { id_sesion: idSesion, activa: true },
      data: {
        fecha_ultima_interaccion: fecha,
        estado_aplicacion: $Enums.estado_aplicacion_enum.ACTIVA,
      },
    });
  }

  async actualizarEstadoAplicacion(
    idSesion: string,
    estado: EstadoAplicacion,
    fecha: Date,
  ): Promise<void> {
    const resultado = await this.prisma.sesiones.updateMany({
      where: { id_sesion: idSesion, activa: true },
      data: {
        estado_aplicacion: estado,
        fecha_ultima_interaccion: fecha,
      },
    });
    if (resultado.count !== 1) {
      throw new EstadoRegistroInvalidoException('La sesión ya no está activa.');
    }
  }

  async cerrar(
    idSesion: string,
    motivo: MotivoCierre,
    fecha: Date,
  ): Promise<boolean> {
    const resultado = await this.prisma.sesiones.updateMany({
      where: { id_sesion: idSesion, activa: true },
      data: {
        activa: false,
        fecha_cierre_sesion: fecha,
        motivo_cierre: motivo,
      },
    });
    return resultado.count === 1;
  }

  async cerrarTodasDelUsuario(
    idUsuario: string,
    motivo: MotivoCierre,
    fecha: Date,
  ): Promise<void> {
    await this.prisma.sesiones.updateMany({
      where: { id_usuario: idUsuario, activa: true },
      data: {
        activa: false,
        fecha_cierre_sesion: fecha,
        motivo_cierre: motivo,
      },
    });
  }

  async contarSolicitudesDesde(
    correoElectronico: string,
    direccionIp: string,
    desde: Date,
  ): Promise<number> {
    return this.prisma.solicitudes_recuperacion.count({
      where: {
        correo_electronico: correoElectronico,
        direccion_ip: direccionIp,
        fecha_solicitud: { gte: desde },
      },
    });
  }

  async registrar(solicitud: NuevaSolicitudRecuperacion): Promise<void> {
    await this.prisma.solicitudes_recuperacion.create({
      data: {
        correo_electronico: solicitud.correoElectronico,
        direccion_ip: solicitud.direccionIp,
        id_usuario: solicitud.idUsuario,
        codigo_hash: solicitud.codigoHash,
        fecha_expiracion: solicitud.fechaExpiracion,
        estado_codigo: solicitud.estado,
      },
    });
  }

  async buscarPorCodigoHash(
    codigoHash: string,
  ): Promise<SolicitudRecuperacionPersistida | null> {
    const solicitud = await this.prisma.solicitudes_recuperacion.findFirst({
      where: { codigo_hash: codigoHash },
      orderBy: { fecha_solicitud: 'desc' },
    });

    return solicitud
      ? {
          id: solicitud.id_solicitud,
          idUsuario: solicitud.id_usuario,
          codigoHash: solicitud.codigo_hash,
          fechaExpiracion: solicitud.fecha_expiracion,
          estado: solicitud.estado_codigo as EstadoCodigo | null,
        }
      : null;
  }

  async marcarExpirada(idSolicitud: string): Promise<void> {
    await this.prisma.solicitudes_recuperacion.update({
      where: { id_solicitud: idSolicitud },
      data: { estado_codigo: $Enums.estado_codigo_enum.EXPIRADO },
    });
  }

  async actualizarContrasenaYConsumirCodigo(
    idSolicitud: string,
    idUsuario: string,
    contrasenaHash: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.solicitudes_recuperacion.updateMany({
        where: {
          id_solicitud: idSolicitud,
          id_usuario: idUsuario,
          estado_codigo: $Enums.estado_codigo_enum.ACTIVO,
          fecha_expiracion: { gt: new Date() },
        },
        data: { estado_codigo: $Enums.estado_codigo_enum.USADO },
      });

      if (actualizado.count !== 1) {
        throw new EstadoRegistroInvalidoException(
          'El código de recuperación ya no está disponible.',
        );
      }

      await tx.usuarios.update({
        where: { id_usuario: idUsuario },
        data: {
          contrasena_hash: contrasenaHash,
          fecha_actualizacion: new Date(),
        },
      });

      await tx.sesiones.updateMany({
        where: { id_usuario: idUsuario, activa: true },
        data: {
          activa: false,
          fecha_cierre_sesion: new Date(),
          motivo_cierre: $Enums.motivo_cierre_enum.VOLUNTARIO,
        },
      });
    });
  }

  private mapSesion(sesion: {
    id_sesion: string;
    id_usuario: string;
    fecha_inicio_sesion: Date;
    fecha_ultima_interaccion: Date;
    limite_inactividad_minutos: number;
    estado_aplicacion: $Enums.estado_aplicacion_enum;
    activa: boolean;
  }): SesionPersistida {
    return {
      id: sesion.id_sesion,
      idUsuario: sesion.id_usuario,
      fechaInicio: sesion.fecha_inicio_sesion,
      fechaUltimaInteraccion: sesion.fecha_ultima_interaccion,
      limiteInactividadMinutos: sesion.limite_inactividad_minutos,
      estadoAplicacion: sesion.estado_aplicacion as EstadoAplicacion,
      activa: sesion.activa,
    };
  }
}
