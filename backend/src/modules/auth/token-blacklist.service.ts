import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenBlacklistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async blacklistToken(token: string, userId: string): Promise<void> {
    try {
      // Decodificar token para obtener fecha de expiración
      const decoded = this.jwtService.decode(token) as any;
      const expiresAt = new Date(decoded.exp * 1000); // exp está en segundos

      // Crear entrada en tabla de tokens blacklisteados
      await this.prisma.blacklistedToken.create({
        data: {
          token,
          userId,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Error blacklisting token:', error);
      // No lanzar error para no interrumpir el logout
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistedToken = await this.prisma.blacklistedToken.findUnique({
        where: { token },
      });

      if (!blacklistedToken) {
        return false;
      }

      // Si el token ya expiró, eliminarlo de la blacklist y retornar false
      if (blacklistedToken.expiresAt < new Date()) {
        await this.prisma.blacklistedToken.delete({
          where: { token },
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking blacklist:', error);
      return false; // En caso de error, permitir el acceso
    }
  }

  // Limpiar tokens expirados (ejecutar periódicamente)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      await this.prisma.blacklistedToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }
}