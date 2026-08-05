export abstract class SessionConfig {
  abstract obtenerLimiteInactividadMinutos(): number;
  abstract obtenerLimiteSegundoPlanoMinutos(): number;
}
