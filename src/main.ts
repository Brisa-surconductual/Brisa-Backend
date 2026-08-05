import * as dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());

  const origenesPermitidos = (
    process.env.PWA_ORIGINS ?? 'http://localhost:5173'
  )
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origenesPermitidos,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  });

  if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY));
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
