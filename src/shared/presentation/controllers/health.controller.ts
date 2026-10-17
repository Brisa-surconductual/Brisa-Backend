import { Controller, Get, Header } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  consultar(): { status: string; revision: string } {
    return {
      status: 'ok',
      revision: process.env.RENDER_GIT_COMMIT ?? 'local',
    };
  }
}
