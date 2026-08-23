import {Injectable} from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import {CreacionUsuarioDtoRequest} from '../dto/creacion-usuario.dto-request';
import {CreacionUsuarioDtoResponse} from '../dto/creacion-usuario.dto-response';
import {frecuenciaConsumo} from '../../domain/value-objects/frecuencia-consumo.vo';
import {semestreCursado} from '../../domain/value-objects/semestre-cursado.vo';
import {CorreoDuplicadoException} from '../../domain/exeption/correo-duplicado.exeption'
import { Usuario } from '../../domain/entities/usuarios.entity';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { LineaBase } from '../../domain/entities/linea-bases.entity';
import { fechasConsumoCoherentes } from '../../domain/value-objects/fechas-consumo-coherentes.vo';
import {PasswordHasher} from '../ports/password-hasher';
import {ConsentimientosRepository} from '../../domain/repositories/consetimientos.repository';  
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import {SessionService} from '../services/sesion.service';

export interface ResultadoCreacionUsuario {
  tokenSesion: string;
  csrfToken: string;
  respuesta: CreacionUsuarioDtoResponse;
}

@Injectable()
export class CreacionUsuarioUseCase{
    constructor(
        private readonly usuarioRepository:UsuarioRepository,
        private readonly passwordHasher:PasswordHasher,
        private readonly consentimientosRepository:ConsentimientosRepository,
        private readonly sessionService:SessionService
    ){}

    async execute(
        dto: CreacionUsuarioDtoRequest,
        ): Promise<ResultadoCreacionUsuario> {

            const correo = new CorreoElectronico(dto.correoElectronico);
            const frecuencia = new frecuenciaConsumo(dto.frecuenciaConsumo);
            const semestre = new semestreCursado(dto.semestre);

            const fechasCoherentes = new fechasConsumoCoherentes(
                dto.fechaInicioConsumo,
                dto.fechaUltimoConsumo,
            );

            const hash = await this.passwordHasher.hash(dto.contrasena);

            const existe = await this.usuarioRepository.buscarPorCorreo(
                dto.correoElectronico,
            );

            if (existe) {
                throw new CorreoDuplicadoException();
            }

            const idConsentimiento =
                await this.consentimientosRepository.obtenerIdConsitimientoVigente();

            if (!idConsentimiento) {
                throw new Error('No se encontró un consentimiento vigente');
            }

            const usuario = Usuario.crearEstudiante(
                correo,
                hash,
                idConsentimiento,
            );

            const lineaBase = LineaBase.crear(
                usuario.id_usuario,
                dto.ciudad,
                dto.entidad_educativa,
                dto.programa_academico,
                semestre,
                dto.nivelAcademico,
                fechasCoherentes.fechaInicio,
                fechasCoherentes.fechaUltimo,
                dto.motivoInicioConsumo,
                frecuencia,
                dto.fechaNacimiento,
            );

            const session = await this.sessionService.crearSesion(
                usuario.id_usuario,
                AlcanceSesion.COMPLETA,
            );

            await this.usuarioRepository.crear(
                usuario,
                lineaBase,
                session.sesion,
            );

            return {
                tokenSesion: session.tokenSesion,
                csrfToken: session.csrfToken,
                respuesta: CreacionUsuarioDtoResponse.crear(
                usuario,
                lineaBase,
                ),
            };
        }
}