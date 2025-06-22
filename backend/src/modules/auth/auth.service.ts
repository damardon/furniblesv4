import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/auth.dto';
import { RegisterDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/auth.dto';
import { TokenBlacklistService } from './token-blacklist.service';

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Usar findById para obtener el user completo
    const fullUser = await this.usersService.findById(user.id);
    await this.usersService.updateLastLogin(fullUser.id);

    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: fullUser.id,
      email: fullUser.email,
      role: fullUser.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        role: fullUser.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const emailVerificationToken = uuidv4();

    const createdUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      emailVerificationToken,
    });

    // Usar findByEmail para obtener el user completo después de la creación
    const fullUser = await this.usersService.findByEmail(registerDto.email);

    console.log(`Verification token for ${registerDto.email}: ${emailVerificationToken}`);

    return {
      message: 'User registered successfully. Check console for verification token.',
      userId: fullUser.id,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await this.usersService.updatePassword(userId, hashedNewPassword);
  }

  async refreshToken(user: any): Promise<{ access_token: string }> {
    const fullUser = await this.usersService.findById(user.id);
    
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: fullUser.id,
      email: fullUser.email,
      role: fullUser.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async logout(token: string, userId: string): Promise<{ message: string }> {
    // Agregar token a blacklist
    if (token) {
      await this.tokenBlacklistService.blacklistToken(token, userId);
    }
    
    return {
      message: 'Sesión cerrada exitosamente',
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      };
    }

    // Generar token de reset
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

    // Guardar token en base de datos
    await this.usersService.savePasswordResetToken(user.id, resetToken, expiresAt);

    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    return {
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Token de recuperación inválido o expirado');
    }

    // Verificar que el token no haya expirado
    if (user.resetPasswordExpiresAt && user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestException('Token de recuperación expirado');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Actualizar contraseña y limpiar token
    await this.usersService.resetUserPassword(user.id, hashedPassword);

    return {
      message: 'Contraseña restablecida exitosamente',
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByVerificationToken(token);
    
    if (!user) {
      throw new BadRequestException('Token de verificación inválido o expirado');
    }

    await this.usersService.verifyEmail(user.id);

    return {
      message: 'Email verificado exitosamente',
    };
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.tokenBlacklistService.isTokenBlacklisted(token);
  }
}