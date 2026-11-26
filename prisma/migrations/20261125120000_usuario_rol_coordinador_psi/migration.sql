-- HU permisos-individuales (RF-03 / RF-04): rol COORDINADOR_PSI.
-- Va en una migracion propia porque Postgres no permite usar un valor nuevo
-- de un enum dentro de la misma transaccion en la que se agrega.
ALTER TYPE "usuario"."rol_enum" ADD VALUE IF NOT EXISTS 'COORDINADOR_PSI';
