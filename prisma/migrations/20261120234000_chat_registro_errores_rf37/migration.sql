CREATE TABLE chat.registro_errores (
    id_registro_error bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    x_request_id varchar(64) NOT NULL CHECK (x_request_id ~ '^[A-Za-z0-9._-]{1,64}$'),
    origen varchar(7) NOT NULL CHECK (origen IN ('BACKEND', 'CLIENTE')),
    codigo varchar(64) NOT NULL,
    status_http smallint,
    id_usuario uuid REFERENCES usuario.usuarios (id_usuario) ON DELETE SET NULL,
    id_sesion uuid REFERENCES chat.sesiones (id_sesion) ON DELETE SET NULL,
    id_nodo uuid REFERENCES chat.nodos (id_nodo) ON DELETE SET NULL,
    fecha_error timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT ck_registro_errores_status CHECK (
        (origen = 'BACKEND' AND status_http IS NOT NULL AND status_http BETWEEN 400 AND 599)
        OR (origen = 'CLIENTE' AND status_http IS NULL)
    )
);

CREATE INDEX ix_registro_errores_request_id ON chat.registro_errores (x_request_id);
CREATE INDEX ix_registro_errores_ventana_cliente
    ON chat.registro_errores (id_usuario, fecha_error) WHERE origen = 'CLIENTE';
