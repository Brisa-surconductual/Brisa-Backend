import { IsBoolean, IsString } from 'class-validator';


export class InformacionConsentimientoVigenteDtoResponse {
  @IsString()
  idConsentimeinto!: string;

  @IsString()
  versionConsetimeinto!: string;

  @IsBoolean()
  vigente!: boolean;

  @IsString()

  @IsString()
  urlContenido!: string;

  @IsString()
  titulo!: string;

  @IsString()
  version!: string;

  static crearRespuesta(
    idConsentimeinto: string,
    versionConsetimeinto: string,
    vigente: boolean,
    urlContenido: string,
    titulo: string,
    version: string
  ): InformacionConsentimientoVigenteDtoResponse {
    const respuesta = new InformacionConsentimientoVigenteDtoResponse();
    respuesta.idConsentimeinto = idConsentimeinto;
    respuesta.versionConsetimeinto = versionConsetimeinto;
    respuesta.vigente = vigente;
    respuesta.urlContenido = urlContenido;
    respuesta.titulo = titulo;
    respuesta.version = version;
    return respuesta;
  }
}