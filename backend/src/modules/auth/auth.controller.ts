import {
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // Password-based login/register disabled — Google OAuth only
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.GONE)
  @ApiOperation({ summary: 'Disabled — use GET /auth/google' })
  async login() {
    return { message: 'Password login disabled. Use Google OAuth: GET /api/auth/google' };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.GONE)
  @ApiOperation({ summary: 'Disabled — use GET /auth/google' })
  async register() {
    return { message: 'Registration disabled. Use Google OAuth: GET /api/auth/google' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refresh(@CurrentUser() user: any) {
    return this.authService.refreshToken(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        status: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' },
        avatar: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser('id') userId: string, @Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token, userId); // ← Debe pasar 2 parámetros
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.GONE)
  @ApiOperation({ summary: 'Disabled — use GET /auth/google' })
  async forgotPassword() {
    return { message: 'Password auth disabled. Use Google OAuth: GET /api/auth/google' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.GONE)
  @ApiOperation({ summary: 'Disabled — use GET /auth/google' })
  async resetPassword() {
    return { message: 'Password auth disabled. Use Google OAuth: GET /api/auth/google' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.GONE)
  @ApiOperation({ summary: 'Disabled — use GET /auth/google' })
  async verifyEmail() {
    return { message: 'Password auth disabled. Use Google OAuth: GET /api/auth/google' };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Passport redirects to Google automatically
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Request() req: any, @Res() res: Response) {
    const { token, refreshToken, user } = await this.authService.loginWithGoogle(req.user);

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');

    // Encode auth data as query params for the frontend to pick up
    const params = new URLSearchParams({
      token,
      refreshToken,
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar ?? '',
    });

    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }
}
