import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { PasswordHasher } from '../src/modules/usuarios/application/ports/password-hasher';

process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';

describe('Usuarios (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const prisma = {
      usuarios: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const passwordHasher: PasswordHasher = {
      hash: async () => 'hashed-password',
      compare: async () => false,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(PasswordHasher)
      .useValue(passwordHasher)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('POST /usuarios crea solo la cuenta inicial', async () => {
    const response = await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        correoElectronico: 'student@example.com',
        contrasena: 'Segura1!',
        confirmarContrasena: 'Segura1!',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      correoElectronico: 'student@example.com',
      estadoRegistro: 'PENDIENTE_CONSENTIMIENTO',
      siguientePaso: 'CONSENTIMIENTO_LINEA_BASE',
    });
    expect(response.body).not.toHaveProperty('contrasenaHash');
  });

  it('rechaza campos de línea base en el registro inicial', async () => {
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        correoElectronico: 'student@example.com',
        contrasena: 'Segura1!',
        confirmarContrasena: 'Segura1!',
        ciudad: 'Bogotá',
      })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
