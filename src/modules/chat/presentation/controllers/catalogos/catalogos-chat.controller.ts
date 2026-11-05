import { Controller, Get, Header } from '@nestjs/common';
import { TipoNodoDtoResponse } from '../../../application/dto/arbol-conversacional.dto-response';
import { CatalogosChatDtoResponse } from '../../../application/dto/chat-admin.dto-response';
import { ConsultarCatalogosChatUseCase } from '../../../application/use-cases/arbol-conversacional/consultar-catalogos-chat.use-case';
import { ListarTiposNodoUseCase } from '../../../application/use-cases/arbol-conversacional/listar-tipos-nodo.use-case';
import { AccesoAdministrativo } from '../../decorators/acceso.decorators';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** Catálogos necesarios para armar un árbol conversacional. */
@Controller('/chat')
@AccesoAdministrativo()
export class CatalogosChatController {
  constructor(
    private readonly consultarCatalogos: ConsultarCatalogosChatUseCase,
    private readonly listarTiposNodo: ListarTiposNodoUseCase,
  ) {}

  @Get('/admin/catalogos')
  @Header('Cache-Control', 'no-store')
  @RespuestaHttp({ envolver: true })
  consultar(): Promise<CatalogosChatDtoResponse> {
    return this.consultarCatalogos.execute();
  }

  /** @deprecated Usar GET /chat/admin/catalogos. */
  @Get('/administracion/tipos-nodo')
  @Header('Cache-Control', 'no-store')
  tiposNodoHistorico(): Promise<TipoNodoDtoResponse[]> {
    return this.listarTiposNodo.execute();
  }
}
