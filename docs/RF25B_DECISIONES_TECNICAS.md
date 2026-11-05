# RF-25B — Decisiones técnicas y limitaciones

## Alcance

Habilitación de modalidad PERSONALIZADA desde GRUPAL para los participantes activos de un programa.

## Reglas adoptadas

1. Participante activo: usuario ESTUDIANTE con estado_cuenta ACTIVA y asignación terapéutica vigente.
2. El 100 % de participantes activos debe tener perfil_completo = true.
3. No se permite la transición si no hay participantes activos.
4. No se permite la transición cuando los participantes activos presentan modalidades mixtas o distintas de GRUPAL.
5. GET y POST utilizan el mismo criterio de participación activa.
6. Solo usuarios ADMINISTRATIVO con sesión completa pueden ejecutar el POST.
7. El POST exige confirmacion_transicion = true.
8. La transición utiliza una transacción Serializable.
9. Se cierran las vigencias GRUPAL de los participantes activos y se crean nuevas vigencias PERSONALIZADA.
10. Se conserva el historial de modalidades y no se modifican las sesiones conversacionales existentes.

## Limitaciones conocidas

### Reactivación de usuarios

Los participantes bloqueados o inactivos no se actualizan.

Si posteriormente regresan al estado ACTIVA, deben reconciliar su modalidad con la política vigente del programa.

Esta reconciliación no forma parte de RF-25B y requiere una definición del flujo de reactivación.

### Permisos de psicología

El esquema actual únicamente identifica los roles ESTUDIANTE y ADMINISTRATIVO.

No se habilitan permisos especiales de psicología sin un mecanismo explícito de autorización.

### Auditoría

chat.tipo_terapia conserva modalidad, vigencias y administrador responsable.

No existe una estructura específica identificada para registrar las verificaciones de elegibilidad y los intentos rechazados.

La auditoría completa requiere una definición de persistencia adicional si se exige registrar esos eventos.

### Existencia del programa

No se identificó una tabla independiente de programas.

La existencia se infiere de las asignaciones terapéuticas; un programa sin asignaciones no puede distinguirse de uno inexistente mediante este modelo.

### Contrato del POST

Se exige confirmacion_transicion = true para satisfacer la confirmación explícita.

El contrato interno anterior solo documentaba id_programa. El cliente frontend deberá enviar ambos campos.

## Condiciones antes de habilitar el POST

- Validar las pruebas unitarias y HTTP.
- Comprobar el tratamiento de participantes inactivos.
- Ejecutar integración PostgreSQL aislada y rollback.
- Confirmar que las sesiones existentes no se modifican.
- Revisar y documentar cualquier limitación que permanezca.

Estas decisiones permiten continuar el desarrollo sin modificar los módulos de otros integrantes.

## Evidencia de validacion

- Compilacion NestJS aprobada.
- 61 pruebas Jest aprobadas.
- 7 verificaciones PostgreSQL aprobadas.
- Concurrencia, rollback y participantes bloqueados validados.
- Sesiones e historial conservados en integracion aislada.
- Limitacion: esquema PostgreSQL reducido; no equivale a E2E sobre esquema productivo completo.
