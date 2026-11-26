import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import {
  CambiarEstadoVariableTaxonomiaDtoRequest,
  ConsultarTaxonomiaVariablesDtoRequest,
  CrearVariableTaxonomiaDtoRequest,
} from '../../../application/dto/taxonomia/taxonomia-variables.dto-request';
import {
  EscrituraVariableTaxonomiaDtoResponse,
  TaxonomiaVariablesDtoResponse,
} from '../../../application/dto/taxonomia/taxonomia-variables.dto-response';
import { CambiarEstadoVariableTaxonomiaUseCase } from '../../../application/use-cases/taxonomia/cambiar-estado-variable-taxonomia.use-case';
import { ConsultarTaxonomiaVariablesUseCase } from '../../../application/use-cases/taxonomia/consultar-taxonomia-variables.use-case';
import { CrearVariableTaxonomiaUseCase } from '../../../application/use-cases/taxonomia/crear-variable-taxonomia.use-case';
import { AccesoAdministrativo } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** RF-30B: taxonomía de variables que capturan los nodos del chat. */
@Controller('/chat/taxonomia-variables')
@AccesoAdministrativo()
export class TaxonomiaVariablesController {
  constructor(
    private readonly consultarTaxonomia: ConsultarTaxonomiaVariablesUseCase,
    private readonly crearVariable: CrearVariableTaxonomiaUseCase,
    private readonly cambiarEstado: CambiarEstadoVariableTaxonomiaUseCase,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @RespuestaHttp({ envolver: true })
  consultar(
    @Query() consulta: ConsultarTaxonomiaVariablesDtoRequest,
  ): Promise<TaxonomiaVariablesDtoResponse> {
    return this.consultarTaxonomia.execute(
      consulta.incluir_deshabilitadas === true,
    );
  }

  @Post()
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  crear(
    @Body() dto: CrearVariableTaxonomiaDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<EscrituraVariableTaxonomiaDtoResponse> {
    return this.crearVariable.execute(dto, idUsuario);
  }

  @Patch('/:codigo')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  cambiar(
    @Param('codigo') codigo: string,
    @Body() dto: CambiarEstadoVariableTaxonomiaDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<EscrituraVariableTaxonomiaDtoResponse> {
    return this.cambiarEstado.execute(codigo, dto.habilitada, idUsuario);
  }
}
