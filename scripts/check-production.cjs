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
  ?.fields.find((field) => field.name === 'consentimiendo_aceptado');
if (consentimiento?.dbName !== 'consentimiento_aceptado') {
  throw new Error(
    'El cliente Prisma no mapea la columna de consentimiento de Supabase.',
  );
}
require('bcrypt');
require('dotenv');
console.log(
  'Entrada compilada, módulos, Prisma, bcrypt y plantilla de correo disponibles.',
);
