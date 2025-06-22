import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Headers,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { RegisterDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { SimpleI18nService } from '../i18n/simple-i18n.service';

@ApiTags('auth')
@Controller('auth')
@ApiHeader({
  name: 'x-custom-lang',
  description: 'Language preference (en, es)',
  required: false,
})
@ApiQuery({
  name: 'lang',
  description: 'Language query parameter (en, es)',
  required: false,
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18nService: SimpleI18nService,
  ) {}

  private getLanguage(headers: any, query: any): string {
    return query.lang || headers['x-custom-lang'] || 
           this.i18nService.detectPreferredLanguage(headers['accept-language']) || 'en';
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const lang = this.getLanguage(headers, query);
    const result = await this.authService.login(loginDto);
    
    return {
      ...result,
      message: this.i18nService.t('auth.login.success', lang),
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const lang = this.getLanguage(headers, query);
    const result = await this.authService.register(registerDto);
    
    return {
      ...result,
      message: this.i18nService.t('auth.register.success', lang),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const lang = this.getLanguage(headers, query);
    await this.authService.changePassword(userId, changePasswordDto);
    
    return { 
      message: this.i18nService.t('auth.changePassword.success', lang)
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@CurrentUser() user: any) {
    return this.authService.refreshToken(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser('id') userId: string, 
    @Request() req,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const lang = this.getLanguage(headers, query);
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token, userId);
    
    return {
      message: this.i18nService.t('auth.logout.success', lang),
    };
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(
    @Body('email') email: string,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const lang = this.getLanguage(headers, query);
    await this.authService.forgotPassword(email);
    
    return {
      message: this.i18nService.t('auth.forgotPassword.success', lang),
    };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const lang = this.getLanguage(headers, query);
    await this.authService.resetPassword(token, newPassword);
    
    return {
      message: this.i18nService.t('auth.resetPassword.success', lang),
    };
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(
    @Body('token') token: string,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const lang = this.getLanguage(headers, query);
    await this.authService.verifyEmail(token);
    
    return {
      message: this.i18nService.t('auth.verification.success', lang),
    };
  }
}