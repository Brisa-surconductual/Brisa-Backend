export abstract class AsignacionCronogramaChatRepository {
  abstract existeAsignacion(idUsuario: string): Promise<boolean>;
}
