import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, rol_enum } from '@prisma/client';

async function main(): Promise<void> {
  const correo = process.argv[2]?.trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL;

  if (!correo) {
    throw new Error('Usage: pnpm user:promote-admin -- correo@example.com');
  }
  if (!connectionString) {
    throw new Error('DATABASE_URL is required.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await prisma.usuarios.update({
      where: { correo_electronico: correo },
      data: { rol: rol_enum.ADMINISTRATIVO },
    });
  } finally {
    await prisma.$disconnect();
  }
}

void main();
