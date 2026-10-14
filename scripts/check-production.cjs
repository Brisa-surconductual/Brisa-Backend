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
if (!require('@prisma/client').Prisma.ModelName) {
  throw new Error('Falta el cliente Prisma generado.');
}
require('bcrypt');
require('dotenv');
console.log(
  'Entrada compilada, módulos, Prisma, bcrypt y plantilla de correo disponibles.',
);
