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
import {Sesion} from '../../domain/entities/sesiones.entity';
import {SesionRepository} from '../../domain/repositories/sesion.repository';
import { SessionTokenHasher } from '../ports/session-token-hasher';
import { SessionTokenGenerator } from '../ports/session-token-generator';
import { SessionConfig } from '../ports/session-config';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';

@Injectable()
export class CreacionUsuarioUseCase{
    constructor(
        private readonly usuarioRepository:UsuarioRepository,
        private readonly passwordHasher:PasswordHasher,
        private readonly sesionRepository:SesionRepository,
        private readonly consentimientosRepository:ConsentimientosRepository,
        private readonly sessionTokenGenerator:SessionTokenGenerator,
        private readonly sessionTokenHasher:SessionTokenHasher,
        private readonly sessionConfig:SessionConfig
    ){}

    async execute(dto: CreacionUsuarioDtoRequest):Promise<CreacionUsuarioDtoResponse>{
       
       const correo =  new CorreoElectronico(dto.correoElectronico);
       const frecuencia = new frecuenciaConsumo(dto.frecuenciaConsumo);
       const semestre = new semestreCursado(dto.semestre);
       const fechasCoherentes = new fechasConsumoCoherentes( dto.fechaInicioConsumo, dto.fechaUltimoConsumo);
       const hash = await this.passwordHasher.hash(dto.contrasena);
     
       const tokenSesion = this.sessionTokenGenerator.generarToken();
       const tokenHash = await this.sessionTokenHasher.hash(tokenSesion); 
       const csrfToken = this.sessionTokenGenerator.generarToken();
       const csrfTokenHash = await this.sessionTokenHasher.hash(csrfToken);
       const limiteInactividad = this.sessionConfig.obtenerLimiteInactividadMinutos();
       const alcanceSesion = AlcanceSesion.COMPLETA
       
       const existe = await this.usuarioRepository.buscarPorCorreo(dto.correoElectronico);
       if(existe)
            {
                throw new CorreoDuplicadoException();
            }

        const idConsentimiento = await this.consentimientosRepository.obtenerIdConsitimientoVigente();
        if(!idConsentimiento)
            {
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
            dto.fechaNacimiento
        );

        const sesion = Sesion.iniciar(
            usuario.id_usuario,
            tokenHash,
            csrfTokenHash,
            alcanceSesion,
            limiteInactividad

        )

        await this.usuarioRepository.crear(usuario,lineaBase, sesion);

        return CreacionUsuarioDtoResponse.crear(usuario,lineaBase);
    
    }
}