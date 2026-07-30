import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreacionUsuarioUseCase } from '../../application/use-cases/creacion-usuario.use-case';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly creacionUsuario: CreacionUsuarioUseCase) {}

  @Post()
  async crear(@Body() dto: CrearUsuarioDto) {
    return this.creacionUsuario.execute(dto);
  }

  @Post('crear')
  @HttpCode(HttpStatus.CREATED)
  async crearAlias(@Body() dto: CrearUsuarioDto) {
    return this.creacionUsuario.execute(dto);
  }
}
