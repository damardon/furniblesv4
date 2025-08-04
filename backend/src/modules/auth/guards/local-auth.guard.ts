import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Permitir peticiones OPTIONS (preflight CORS)
    if (request.method === 'OPTIONS') {
      return true;
    }
    
    return super.canActivate(context);
  }
}