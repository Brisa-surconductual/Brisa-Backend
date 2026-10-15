import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    app = modulo.createNestApplication();
    await app.init();
  });

  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => app.close());

  it('informa el commit desplegado sin importar Prisma ni activar jobs', async () => {
    const revision = 'a'.repeat(40);
    jest.replaceProperty(process, 'env', { RENDER_GIT_COMMIT: revision });
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect({ status: 'ok', revision });
  });

  it('identifica una ejecución local', () => {
    jest.replaceProperty(process, 'env', {});
    expect(new HealthController().consultar()).toEqual({
      status: 'ok',
      revision: 'local',
    });
  });
});
