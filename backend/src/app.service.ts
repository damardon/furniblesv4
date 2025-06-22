import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    return {
      message: 'Furnibles API is running successfully! 🚀',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV', 'development'),
      version: '1.0.0',
    };
  }

  getVersion() {
    return {
      name: 'Furnibles API',
      version: '1.0.0',
      description: 'Marketplace C2C de planos digitales de muebles',
    };
  }

  getHello(): string {
    return 'Hello World!';
  }
}