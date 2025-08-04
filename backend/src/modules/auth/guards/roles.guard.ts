import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Permitir peticiones OPTIONS (preflight CORS)
    if (request.method === 'OPTIONS') {
      return true;
    }
    
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const user = request.user as any; // ← CAMBIAR: usar 'as any' temporalmente
    
    if (!user) {
      return false;
    }

    // Verificar si el usuario tiene uno de los roles requeridos
    return requiredRoles.some((role) => user.role === role);
  }
}