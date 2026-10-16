import { Consentimiento } from '../../domain/entities/consentimientos.entity';

export class ConsentimientoMapper {
  static toDomain(consentimiento: {
    id_consentimiento: string;
    version_consentimiento: string;
    vigente: boolean;
    motivo_invalidacion: string;
    fecha_invalidacion?: Date | null;
    url_contenido: string;
    titulo: string;
  }): Consentimiento {
    return new Consentimiento(
      consentimiento.id_consentimiento,
      consentimiento.version_consentimiento,
      consentimiento.vigente,
      consentimiento.motivo_invalidacion,
      consentimiento.url_contenido,
      consentimiento.titulo,
      consentimiento.fecha_invalidacion,
    );
  }
}
