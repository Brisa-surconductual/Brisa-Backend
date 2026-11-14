import { ContenidoVigenteChatRepository } from '../domain/repositories/contenido-vigente-chat.repository';
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
import { ComprobarFormatoRespuestaPort, ProcesarRespuestaPort, } from '../application/ports/procesar-respuesta.port';
import { PrismaProcesarRespuestaRepository } from './persistence/prisma-procesar-respuesta.repository';
import { FormatoRespuestaAdapter } from './validation/formato-respuesta.adapter';
import { PrismaPresentacionNodoActualRepository } from './persistence/prisma-presentacion-nodo-actual.repository';
import { S3FirmarRecursoNodoAdapter } from './storage/s3-firmar-recurso-nodo.adapter';
import { FirmarRecursoNodoPort, PresentacionNodoActualPort, } from '../application/ports/presentacion-nodo-actual.port';

export const ChatInfrastructureProviders = [
  {
    provide: ProcesarRespuestaPort,
    useClass: PrismaProcesarRespuestaRepository,
  },
  { provide: ComprobarFormatoRespuestaPort, 
    useClass: FormatoRespuestaAdapter 
  },
  {
    provide: PresentacionNodoActualPort,
    useClass: PrismaPresentacionNodoActualRepository,
  },
  { provide: FirmarRecursoNodoPort, 
    useClass: S3FirmarRecursoNodoAdapter 
  },
  {
    provide: ModalidadProgramaRepository,
    useClass: PrismaModalidadProgramaRepository,
  },
  {
    provide: ContenidoVigenteChatRepository,
    useClass: CronogramaContenidoVigenteChatRepository,
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
