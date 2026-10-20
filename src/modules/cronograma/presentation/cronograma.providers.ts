import { CronogramaController } from './cronograma.controller';
import { ContenidoVigenteController } from './contenido-vigente.controller';
import { ContenidoVigenteAdministrativoController } from './contenido-vigente-administrativo.controller';
import { InformacionTemporalController } from './informacion-temporal.controller';
import { UbicacionesTemporalesParticipantesController } from './ubicaciones-temporales-participantes.controller';

export const CronogramaPresentationProviders = [
  CronogramaController,
  ContenidoVigenteController,
  ContenidoVigenteAdministrativoController,
  InformacionTemporalController,
  UbicacionesTemporalesParticipantesController,
];
