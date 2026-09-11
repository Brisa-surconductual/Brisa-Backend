import { CronogramaController } from './cronograma.controller';
import { ContenidoVigenteController } from './contenido-vigente.controller';
import { InformacionTemporalController } from './informacion-temporal.controller';
import { UbicacionesTemporalesParticipantesController } from './ubicaciones-temporales-participantes.controller';

export const CronogramaPresentationProviders = [
  CronogramaController,
  ContenidoVigenteController,
  InformacionTemporalController,
  UbicacionesTemporalesParticipantesController,
];
