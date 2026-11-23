import { AuditoriaAdministrativaPort } from '../../../shared/application/ports/auditoria-administrativa.port';
import { PrismaAuditoriaAdministrativaAdapter } from '../../../shared/infrastructure/persistence/prisma-auditoria-administrativa.adapter';
import { SeudonimoParticipantePort } from '../application/ports/seudonimo-participante.port';
import { PrismaSeudonimoParticipanteAdapter } from './persistence/prisma-seudonimo-participante.adapter';
import { IntervencionSosPort } from '../application/ports/intervencion-sos.port';
import { ExpirarIntervencionesSosCron } from './cron/expirar-intervenciones-sos.cron';
import { PrismaIntervencionSosRepository } from './persistence/prisma-intervencion-sos.repository';
import { ContenidoVigenteChatRepository } from '../domain/repositories/contenido-vigente-chat.repository';
import { HabilitacionContenidoChatRepository } from '../domain/repositories/habilitacion-contenido-chat.repository';
import { CronogramaHabilitacionContenidoChatRepository } from './persistence/cronograma-habilitacion-contenido-chat.repository';
import { ArbolConversacionalRepository } from '../domain/repositories/arbol-conversacional.repository';
import { ContextoConversacionalRepository } from '../domain/repositories/contexto-conversacional.repository';
import { CronogramaContenidoVigenteChatRepository } from './persistence/cronograma-contenido-vigente-chat.repository';
import { PrismaArbolConversacionalRepository } from './persistence/prisma-arbol-conversacional.repository';
import { PrismaContextoConversacionalRepository } from './persistence/prisma-contexto-conversacional.repository';
import { AsignacionCronogramaChatRepository } from '../domain/repositories/asignacion-cronograma-chat.repository';
import { SesionConversacionalRepository } from '../domain/repositories/sesion-conversacional.repository';
import { PrismaAsignacionCronogramaChatRepository } from './persistence/prisma-asignacion-cronograma-chat.repository';
import { PrismaSesionConversacionalRepository } from './persistence/prisma-sesion-conversacional.repository';
import { ModalidadProgramaRepository } from '../domain/repositories/modalidad-programa.repository';
import { PrismaModalidadProgramaRepository } from './persistence/prisma-modalidad-programa.repository';
import { InicializarModalidadRegistroListener } from './messaging/inicializar-modalidad-registro.listener';
import {
  ComprobarFormatoRespuestaPort,
  ProcesarRespuestaPort,
} from '../application/ports/procesar-respuesta.port';
import { PrismaProcesarRespuestaRepository } from './persistence/prisma-procesar-respuesta.repository';
import { FormatoRespuestaAdapter } from './validation/formato-respuesta.adapter';
import { PrismaPresentacionNodoActualRepository } from './persistence/prisma-presentacion-nodo-actual.repository';
import { S3FirmarRecursoNodoAdapter } from './storage/s3-firmar-recurso-nodo.adapter';
import { HistorialInteraccionesRepository } from '../domain/repositories/historial-interacciones.repository';
import { PrismaHistorialInteraccionesRepository } from './persistence/prisma-historial-interacciones.repository';
import { BullMqEventosSeguimientoWorker } from './messaging/bullmq-eventos-seguimiento.worker';
import { PrismaEventosSeguimientoRepository } from './persistence/prisma-eventos-seguimiento.repository';
import { PerfilClinicoVigentePort } from '../application/ports/perfil-clinico-vigente.port';
import { PrismaPerfilClinicoVigenteAdapter } from './persistence/prisma-perfil-clinico-vigente.adapter';
import { RecuperarSesionConversacionalPort } from '../application/ports/recuperar-sesion-conversacional.port';
import { PrismaRecuperarSesionConversacionalRepository } from './persistence/prisma-recuperar-sesion-conversacional.repository';
import { RegistroErroresConversacionalesRepository } from '../domain/repositories/registro-errores-conversacionales.repository';
import { PrismaRegistroErroresConversacionalesRepository } from './persistence/prisma-registro-errores-conversacionales.repository';
import { TaxonomiaVariablesRepository } from '../domain/repositories/taxonomia-variables.repository';
import { VariablesEtiquetadasRepository } from '../domain/repositories/variables-etiquetadas.repository';
import { PrismaTaxonomiaVariablesRepository } from './persistence/prisma-taxonomia-variables.repository';
import { PrismaVariablesEtiquetadasRepository } from './persistence/prisma-variables-etiquetadas.repository';
import {
  FirmarRecursoNodoPort,
  PresentacionNodoActualPort,
} from '../application/ports/presentacion-nodo-actual.port';

export const ChatInfrastructureProviders = [
  {
    provide: TaxonomiaVariablesRepository,
    useClass: PrismaTaxonomiaVariablesRepository,
  },
  {
    provide: VariablesEtiquetadasRepository,
    useClass: PrismaVariablesEtiquetadasRepository,
  },
  PrismaEventosSeguimientoRepository,
  BullMqEventosSeguimientoWorker,
  { provide: IntervencionSosPort, useClass: PrismaIntervencionSosRepository },
  {
    provide: SeudonimoParticipantePort,
    useClass: PrismaSeudonimoParticipanteAdapter,
  },
  // RF-123: bitácora administrativa (función existente, sin cambios de esquema).
  {
    provide: AuditoriaAdministrativaPort,
    useClass: PrismaAuditoriaAdministrativaAdapter,
  },
  ExpirarIntervencionesSosCron,
  {
    provide: PerfilClinicoVigentePort,
    useClass: PrismaPerfilClinicoVigenteAdapter,
  },
  {
    provide: RegistroErroresConversacionalesRepository,
    useClass: PrismaRegistroErroresConversacionalesRepository,
  },
  {
    provide: ProcesarRespuestaPort,
    useClass: PrismaProcesarRespuestaRepository,
  },
  { provide: ComprobarFormatoRespuestaPort, useClass: FormatoRespuestaAdapter },
  {
    provide: PresentacionNodoActualPort,
    useClass: PrismaPresentacionNodoActualRepository,
  },
  { provide: FirmarRecursoNodoPort, useClass: S3FirmarRecursoNodoAdapter },
  PrismaHistorialInteraccionesRepository,
  {
    provide: HistorialInteraccionesRepository,
    useExisting: PrismaHistorialInteraccionesRepository,
  },
  {
    provide: RecuperarSesionConversacionalPort,
    useClass: PrismaRecuperarSesionConversacionalRepository,
  },
  {
    provide: ModalidadProgramaRepository,
    useClass: PrismaModalidadProgramaRepository,
  },
  InicializarModalidadRegistroListener,
  {
    provide: ContenidoVigenteChatRepository,
    useClass: CronogramaContenidoVigenteChatRepository,
  },
  {
    provide: HabilitacionContenidoChatRepository,
    useClass: CronogramaHabilitacionContenidoChatRepository,
  },
  {
    provide: ArbolConversacionalRepository,
    useClass: PrismaArbolConversacionalRepository,
  },
  {
    provide: ContextoConversacionalRepository,
    useClass: PrismaContextoConversacionalRepository,
  },
  {
    provide: SesionConversacionalRepository,
    useClass: PrismaSesionConversacionalRepository,
  },
  {
    provide: AsignacionCronogramaChatRepository,
    useClass: PrismaAsignacionCronogramaChatRepository,
  },
];
