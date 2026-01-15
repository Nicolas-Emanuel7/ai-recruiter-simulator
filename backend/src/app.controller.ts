import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Verifica se a API está funcionando',
  })
  @ApiResponse({ status: 200, description: 'API está funcionando' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check detalhado',
    description: 'Retorna status detalhado da API',
  })
  @ApiResponse({ status: 200, description: 'Status da API' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ai-recruiter-simulator',
      version: '1.0.0',
    };
  }
}
