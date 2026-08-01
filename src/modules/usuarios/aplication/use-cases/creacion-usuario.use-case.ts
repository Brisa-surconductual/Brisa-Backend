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

@Injectable()
export class CreacionUsuarioUseCase{
    constructor(
        private readonly usuarioRepository:UsuarioRepository,
        private readonly passwordHasher:PasswordHasher
    ){}

    async execute(dto: CreacionUsuarioDtoRequest):Promise<CreacionUsuarioDtoResponse>{
       
       const correo =  new CorreoElectronico(dto.correoElectronico);
       const frecuencia = new frecuenciaConsumo(dto.frecuenciaConsumo);
       const semestre = new semestreCursado(dto.semestre);
       const fechasCoherentes = new fechasConsumoCoherentes( dto.fechaInicioConsumo, dto.fechaUltimoConsumo);
       const hash = await this.passwordHasher.hash(dto.constrasenaHash);
        

       const existe = await this.usuarioRepository.buscarPorCorreo(dto.correoElectronico);
       if(existe)
            {
                throw new CorreoDuplicadoException();
            }



        const usuario = Usuario.crear(
            correo,
            hash,
            dto.rol,
            dto.estadoRegistro,
            dto.estadoCuenta,
            dto.fechaRegistro ,
            dto.consentimientoAceptado,
            dto.registroConsumoAceptado,
            dto.idConsentimiento
        );

        const lineaBase = LineaBase.crear(
            usuario.getId(),
            dto.ciudad,
            dto.entidad_educativa,
            dto.programa_academico,
            semestre,
            dto.nivelAcademico,
            fechasCoherentes.fechaInicio,
            fechasCoherentes.fechaUltimo,
            dto.motivoInicioConsumo,
            frecuencia,
            dto.fechaCreacion, 
            dto.fechaNacimiento
        );

        await this.usuarioRepository.crear(usuario,lineaBase);


        const response = new CreacionUsuarioDtoResponse();
        return response;
    }
}