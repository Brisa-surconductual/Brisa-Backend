import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed the database.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const version = process.env.CONSENT_VERSION ?? '1.0.0';
    await prisma.consentimientos.upsert({
      where: { version_consentimiento: version },
      create: {
        version_consentimiento: version,
        vigente: true,
        url_contenido:
          process.env.CONSENT_CONTENT_URL ??
          'http://localhost:5173/consentimiento',
        titulo: process.env.CONSENT_TITLE ?? 'Consentimiento informado',
      },
      update: {
        vigente: true,
        url_contenido:
          process.env.CONSENT_CONTENT_URL ??
          'http://localhost:5173/consentimiento',
        titulo: process.env.CONSENT_TITLE ?? 'Consentimiento informado',
        fecha_invalidacion: null,
        motivo_invalidacion: null,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

void main();
