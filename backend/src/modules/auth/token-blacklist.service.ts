import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens = new Map<string, { userId: string; expiresAt: Date }>();

  constructor(private readonly jwtService: JwtService) {
    // Limpiar tokens expirados cada hora
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }

  async blacklistToken(token: string, userId: string): Promise<void> {
    try {
      // Decodificar token para obtener fecha de expiración
      const decoded = this.jwtService.decode(token) as any;
      const expiresAt = new Date(decoded.exp * 1000); // exp está en segundos

      // Almacenar en memoria
      this.blacklistedTokens.set(token, { userId, expiresAt });

      // Programar eliminación automática cuando expire
      const timeUntilExpiration = expiresAt.getTime() - Date.now();
      if (timeUntilExpiration > 0) {
        setTimeout(() => {
          this.blacklistedTokens.delete(token);
        }, timeUntilExpiration);
      }
    } catch (error) {
      console.error('Error blacklisting token:', error);
      // No lanzar error para no interrumpir el logout
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistedData = this.blacklistedTokens.get(token);
      
      if (!blacklistedData) {
        return false;
      }

      // Si el token ya expiró, eliminarlo y retornar false
      if (blacklistedData.expiresAt < new Date()) {
        this.blacklistedTokens.delete(token);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking blacklist:', error);
      return false; // En caso de error, permitir el acceso
    }
  }

  // Limpiar tokens expirados (ejecutar periódicamente)
  private cleanupExpiredTokens(): void {
    try {
      const now = new Date();
      const expiredTokens: string[] = [];

      // Encontrar tokens expirados
      for (const [token, data] of this.blacklistedTokens.entries()) {
        if (data.expiresAt < now) {
          expiredTokens.push(token);
        }
      }

      // Eliminar tokens expirados
      expiredTokens.forEach(token => {
        this.blacklistedTokens.delete(token);
      });

      if (expiredTokens.length > 0) {
        console.log(`Cleaned up ${expiredTokens.length} expired tokens`);
      }
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }

  // Método para debugging - ver cuántos tokens están en blacklist
  getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }

  // Método para limpiar toda la blacklist (útil en testing)
  clearBlacklist(): void {
    this.blacklistedTokens.clear();
  }
}