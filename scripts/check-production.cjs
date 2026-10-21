const { accessSync } = require('node:fs');
const { resolve } = require('node:path');

const output = resolve(__dirname, '../dist');
accessSync(resolve(output, 'src/main.js'));
accessSync(
  resolve(
    output,
    'src/modules/usuarios/infrastructure/email/templates/recuperacion-constrasena.html',
  ),
);

// Importar el módulo comprueba dependencias; no crea Nest ni ejecuta onModuleInit/jobs.
require(resolve(output, 'src/app.module.js'));
const { Prisma } = require('@prisma/client');
if (!Prisma.ModelName) {
  throw new Error('Falta el cliente Prisma generado.');
}
const consentimiento = Prisma.dmmf.datamodel.models
  .find((model) => model.name === 'usuarios')
  ?.fields.find((field) => field.name === 'consentimiento_aceptado');

if (
  !consentimiento ||
  (consentimiento.dbName ?? consentimiento.name) !== 'consentimiento_aceptado'
) {
  throw new Error(
    'El cliente Prisma no contiene la columna de consentimiento esperada.',
  );
}
require('bcrypt');
require('dotenv');
console.log(
  'Entrada compilada, módulos, Prisma, bcrypt y plantilla de correo disponibles.',
);
