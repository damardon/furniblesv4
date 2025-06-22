import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'API is running'
  })
  getHealth(@I18n() i18n: I18nContext) {
    return {
      message: 'Furnibles API is running successfully! 🚀',
      timestamp: new Date().toISOString(),
      environment: 'development',
      version: '1.0.0',
      welcome: i18n.t('test.welcome'),
    };
  }

  @Get('version')
  @ApiOperation({ summary: 'Get API version' })
  @ApiResponse({ 
    status: 200, 
    description: 'API version information'
  })
  getVersion() {
    return {
      name: 'Furnibles API',
      version: '1.0.0',
      description: 'Marketplace C2C de planos digitales de muebles',
    };
  }
}