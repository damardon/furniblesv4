import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { TokenBlacklistService } from '../token-blacklist.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TokenBlacklistInterceptor implements NestInterceptor {
  constructor(
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Verificar si el token está en blacklist
      const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(token);
      
      if (isBlacklisted) {
        throw new UnauthorizedException('Token ha sido revocado');
      }
    }

    return next.handle();
  }
}