const fs = require('fs');
const path = require('path');

const nombre = process.argv[2];

if (!nombre) {
  console.error(' Error: Debes proporcionar un nombre para la migración');
  console.log('Uso: pnpm run create-migration nombre_de_la_migracion');
  process.exit(1);
}

// Generar timestamp en formato YYYYMMDDHHMMSS
const ahora = new Date();
const timestamp =
  ahora.getFullYear().toString() +
  String(ahora.getMonth() + 1).padStart(2, '0') +
  String(ahora.getDate()).padStart(2, '0') +
  String(ahora.getHours()).padStart(2, '0') +
  String(ahora.getMinutes()).padStart(2, '0') +
  String(ahora.getSeconds()).padStart(2, '0');

// Sanitizar el nombre (reemplazar espacios por guiones bajos, solo caracteres válidos)
const nombreSanitizado = nombre
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(/[^a-z0-9_]/g, '');

const nombreCarpeta = `${timestamp}_${nombreSanitizado}`;
const rutaCarpeta = path.join('prisma', 'migrations', nombreCarpeta);

// Crear la carpeta
fs.mkdirSync(rutaCarpeta, { recursive: true });

// Crear el archivo migration.sql con contenido inicial
const contenidoInicial = `-- Migración: ${nombreSanitizado}
-- Fecha: ${ahora.toISOString()}
-- Descripción: [Describe qué hace esta migración]

-- Escribe tu SQL aquí:

`;

fs.writeFileSync(path.join(rutaCarpeta, 'migration.sql'), contenidoInicial);

console.log(' Migración creada exitosamente:');
console.log(` ${rutaCarpeta}`);
console.log(` ${path.join(rutaCarpeta, 'migration.sql')}`);
console.log('\nSiguiente paso: Edita el archivo migration.sql con tu SQL');
