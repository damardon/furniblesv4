import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  BadRequestException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationService } from './notifications.service';
import {
  CreateNotificationDto,
  CreateScheduledNotificationDto,
  UpdateNotificationPreferencesDto,
  FilterNotificationsDto,
  SendReviewDigestDto,
  NotificationAnalyticsDto,
  TrackEngagementDto,
  NotificationResponseDto,
  NotificationPreferencesResponseDto
} from './dto/notification.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  // ==========================================
  // ENDPOINTS PÚBLICOS Y EXISTENTES (mantenidos)
  // ==========================================

  /**
   * 🔄 EXISTENTE: Obtener notificaciones del usuario autenticado
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user notifications with advanced filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    type: [NotificationResponseDto]
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'channel', required: false, description: 'Filter by channel' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean, description: 'Filter by read status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO string)' })
  async getUserNotifications(
    @Request() req,
    @Query(ValidationPipe) filters: FilterNotificationsDto
  ) {
    const userId = req.user.sub;
    return await this.notificationService.getUserNotifications(userId, filters);
  }

  /**
   * 🔄 EXISTENTE: Marcar notificación como leída
   */
  @Put(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read'
  })
  async markAsRead(
    @Param('id', ParseUUIDPipe) notificationId: string,
    @Request() req
  ) {
    const userId = req.user.sub;
    await this.notificationService.markAsRead(notificationId, userId);
    return { message: 'Notification marked as read' };
  }

  /**
   * 🔄 EXISTENTE: Marcar todas las notificaciones como leídas
   */
  @Put('mark-all-read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read'
  })
  async markAllAsRead(@Request() req) {
    const userId = req.user.sub;
    await this.notificationService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  // ==========================================
  // 🆕 NUEVOS ENDPOINTS PARA ETAPA 10
  // ==========================================

  /**
   * 🆕 NUEVO: Obtener preferencias de notificación del usuario
   */
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification preferences retrieved successfully',
    type: NotificationPreferencesResponseDto
  })
  async getNotificationPreferences(@Request() req) {
    const userId = req.user.sub;
    const preferences = await this.notificationService.getUserPreferences(userId);
    return preferences;
  }

  /**
   * 🆕 NUEVO: Actualizar preferencias de notificación
   */
  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification preferences updated successfully'
  })
  async updateNotificationPreferences(
    @Request() req,
    @Body(ValidationPipe) dto: UpdateNotificationPreferencesDto
  ) {
    const userId = req.user.sub;
    await this.notificationService.updateNotificationPreferences(userId, dto);
    return { message: 'Notification preferences updated successfully' };
  }

  /**
   * 🆕 NUEVO: Tracking de engagement de notificación
   */
  @Post('track-engagement')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track notification engagement (read, click, dismiss)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Engagement tracked successfully'
  })
  async trackEngagement(
    @Request() req,
    @Body(ValidationPipe) dto: TrackEngagementDto
  ) {
    const userId = req.user.sub;
    await this.notificationService.trackEngagement(dto, userId);
    return { message: 'Engagement tracked successfully' };
  }

  /**
   * 🆕 NUEVO: Crear notificación programada
   */
  @Post('schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER) // Solo admins y sellers pueden programar
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Schedule a notification for later delivery' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification scheduled successfully'
  })
  async scheduleNotification(
    @Request() req,
    @Body(ValidationPipe) dto: CreateScheduledNotificationDto
  ) {
    // Verificar que el usuario puede programar notificaciones para este userId
    const currentUserId = req.user.sub;
    const userRole = req.user.role;

    if (userRole !== UserRole.ADMIN && dto.userId !== currentUserId) {
      throw new ForbiddenException('You can only schedule notifications for yourself');
    }

    await this.notificationService.scheduleNotification(dto);
    return { message: 'Notification scheduled successfully' };
  }

  /**
   * 🆕 NUEVO: Enviar digest manual de reviews (para sellers)
   */
  @Post('review-digest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send manual review digest for seller' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review digest sent successfully'
  })
  async sendReviewDigest(
    @Request() req,
    @Body(ValidationPipe) dto: SendReviewDigestDto
  ) {
    const currentUserId = req.user.sub;
    const userRole = req.user.role;

    // Verificar que el seller solo puede solicitar su propio digest
    if (userRole === UserRole.SELLER && dto.sellerId !== currentUserId) {
      throw new ForbiddenException('You can only request your own review digest');
    }

    await this.notificationService.sendReviewWeeklyDigest(dto);
    return { message: 'Review digest sent successfully' };
  }

  /**
   * 🆕 NUEVO: Obtener analytics de notificaciones
   */
  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification analytics and engagement metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully'
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' })
  @ApiQuery({ name: 'channel', required: false, description: 'Filter by notification channel' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'groupBy', required: false, description: 'Group by: day, week, month, type, channel' })
  async getNotificationAnalytics(
    @Request() req,
    @Query(ValidationPipe) filters: NotificationAnalyticsDto
  ) {
    const userId = req.user.sub;
    const userRole = req.user.role;

    // Los usuarios normales solo pueden ver sus propias analytics
    if (userRole !== UserRole.ADMIN) {
      filters.userId = userId;
    }

    return await this.notificationService.getNotificationAnalytics(filters);
  }

  /**
   * 🆕 NUEVO: Obtener notificación específica
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto
  })
  async getNotification(
    @Param('id', ParseUUIDPipe) notificationId: string,
    @Request() req
  ) {
    const userId = req.user.sub;
    
    const notifications = await this.notificationService.getUserNotifications(userId, {
      page: 1,
      limit: 1
    });

    const notification = notifications.data.find(n => n.id === notificationId);
    
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  // ==========================================
  // 🆕 ENDPOINTS ESPECÍFICOS PARA REVIEWS
  // ==========================================

  /**
   * 🆕 NUEVO: Obtener notificaciones de reviews únicamente
   */
  @Get('reviews/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all review-related notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review notifications retrieved successfully'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getReviewNotifications(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userId = req.user.sub;
    
    const filters: FilterNotificationsDto = {
      page: page || 1,
      limit: Math.min(limit || 20, 100)
    };

    // Filtrar solo notificaciones de reviews
    const reviewTypes = [
      'REVIEW_RECEIVED',
      'REVIEW_RESPONSE_RECEIVED',
      'REVIEW_HELPFUL_VOTE',
      'REVIEW_WEEKLY_DIGEST',
      'REVIEW_FOLLOW_UP',
      'REVIEW_MILESTONE',
      'REVIEW_PENDING_REMINDER'
    ];

    const allNotifications = await this.notificationService.getUserNotifications(userId, filters);
    
    // Filtrar manualmente por tipos de review
    const reviewNotifications = allNotifications.data.filter(notification => 
      reviewTypes.includes(notification.type as string)
    );

    return {
      ...allNotifications,
      data: reviewNotifications,
      total: reviewNotifications.length
    };
  }

  /**
   * 🆕 NUEVO: Enviar recordatorio manual de review
   */
  @Post('reviews/send-reminders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger review reminders (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review reminders sent successfully'
  })
  async sendReviewReminders(@Request() req) {
    await this.notificationService.sendReviewReminders();
    return { message: 'Review reminders sent successfully' };
  }

  // ==========================================
  // 🆕 ENDPOINTS ADMINISTRATIVOS
  // ==========================================

  /**
   * 🆕 NUEVO: Crear notificación manual (Admin)
   */
  @Post('admin/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create manual notification (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification created successfully'
  })
  async createManualNotification(
    @Body(ValidationPipe) dto: CreateNotificationDto
  ) {
    await this.notificationService.createNotification(dto);
    return { message: 'Notification created successfully' };
  }

  /**
   * 🆕 NUEVO: Obtener estadísticas globales de notificaciones (Admin)
   */
  @Get('admin/global-analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global notification analytics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global analytics retrieved successfully'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'groupBy', required: false, description: 'Group by period' })
  async getGlobalAnalytics(
    @Query(ValidationPipe) filters: NotificationAnalyticsDto
  ) {
    // No especificar userId para obtener analytics globales
    return await this.notificationService.getNotificationAnalytics(filters);
  }

  /**
   * 🆕 NUEVO: Obtener métricas de engagement por tipo (Admin)
   */
  @Get('admin/engagement-metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get engagement metrics by notification type (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Engagement metrics retrieved successfully'
  })
  async getEngagementMetrics() {
    return await this.notificationService.getNotificationAnalytics({
      groupBy: 'type'
    });
  }

  /**
   * 🆕 NUEVO: Obtener estadísticas de digest de reviews (Admin)
   */
  @Get('admin/digest-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get review digest statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Digest statistics retrieved successfully'
  })
  async getDigestStats() {
    return await this.notificationService.getNotificationAnalytics({
      type: 'REVIEW_WEEKLY_DIGEST' as any,
      groupBy: 'week'
    });
  }

  /**
   * 🆕 NUEVO: Forzar envío de digests semanales (Admin)
   */
  @Post('admin/force-weekly-digests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Force send weekly digests to all eligible sellers (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly digests sent successfully'
  })
  async forceWeeklyDigests() {
    await this.notificationService.sendWeeklyDigests();
    return { message: 'Weekly digests sent to all eligible sellers' };
  }

  /**
   * 🆕 NUEVO: Limpiar notificaciones expiradas manualmente (Admin)
   */
  @Post('admin/cleanup-expired')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually cleanup expired notifications (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expired notifications cleaned up successfully'
  })
  async cleanupExpiredNotifications() {
    await this.notificationService.cleanupExpiredNotifications();
    return { message: 'Expired notifications cleaned up successfully' };
  }

  // ==========================================
  // 🆕 ENDPOINTS DE CONFIGURACIÓN
  // ==========================================

  /**
   * 🆕 NUEVO: Obtener configuración de digest del usuario
   */
  @Get('digest/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user digest configuration (Sellers only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Digest configuration retrieved successfully'
  })
  async getDigestConfig(@Request() req) {
    const userId = req.user.sub;
    const preferences = await this.notificationService.getUserPreferences(userId);

    return {
      digestFrequency: (preferences as any).digestFrequency ?? null,
      digestDay: (preferences as any).digestDay ?? null,
      digestTime: (preferences as any).digestTime ?? null,
      timezone: (preferences as any).timezone ?? null
    };
  }

  /**
   * 🆕 NUEVO: Test de notificación (para desarrollo)
   */
  @Post('test/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send test notification (Admin only - Development)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test notification sent successfully'
  })
  async sendTestNotification(
    @Request() req,
    @Body() body: { userId?: string; type?: string; message?: string }
  ) {
    const targetUserId = body.userId || req.user.sub;
    
    await this.notificationService.createNotification({
      userId: targetUserId,
      type: (body.type as any) || 'SYSTEM_NOTIFICATION',
      title: 'Test Notification',
      message: body.message || 'This is a test notification from the system',
      data: {
        test: true,
        sentAt: new Date().toISOString(),
        sentBy: req.user.sub
      }
    });

    return { message: 'Test notification sent successfully' };
  }

  /**
   * 🆕 NUEVO: Obtener salud del sistema de notificaciones (Admin)
   */
  @Get('admin/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification system health status (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System health retrieved successfully'
  })
  async getSystemHealth() {
    // Obtener métricas básicas del sistema
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await this.notificationService.getNotificationAnalytics({
      startDate: thirtyDaysAgo.toISOString(),
      endDate: new Date().toISOString(),
      groupBy: 'day'
    });

    return {
      status: 'healthy',
      uptime: process.uptime(),
      lastMonthSummary: analytics.summary,
      timestamp: new Date().toISOString()
    };
  }
}
