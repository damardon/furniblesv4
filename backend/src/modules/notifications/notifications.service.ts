import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  DigestFrequency,
  Prisma 
} from '@prisma/client';
import { 
  CreateNotificationDto,
  CreateScheduledNotificationDto,
  UpdateNotificationPreferencesDto,
  FilterNotificationsDto,
  SendReviewDigestDto,
  NotificationAnalyticsDto,
  TrackEngagementDto
} from './dto/notification.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * Función helper para traducciones (MANTENER EXISTENTE)
   */
  private getTranslation(key: string, lang: string, args?: any): string {
    const translations = {
      en: {
        'notifications.orderCreated': 'Order Created Successfully!',
        'notifications.orderCreatedMsg': 'Your order {orderNumber} has been created. Please proceed to payment to receive your files.',
        'notifications.orderPaid': 'Payment Confirmed!',
        'notifications.orderPaidMsg': 'Your payment for order {orderNumber} has been processed successfully. We are preparing your files.',
        'notifications.orderCompleted': 'Files Ready for Download!',
        'notifications.orderCompletedMsg': 'Your order {orderNumber} is complete. You can now download your files.',
        'notifications.productSold': 'New Sale!',
        'notifications.productSoldMsg': 'You sold {itemCount} product(s) for a total of ${sellerAmount}.',
        'cart.buyerOnly': 'Only buyers can add products to cart',
        'cart.limitExceeded': 'Cart limit exceeded (10 products max)',
        'cart.alreadyExists': 'Product already in cart',
        'cart.ownProduct': 'You cannot buy your own product',
        'cart.itemNotFound': 'Item not found in cart',
        // 🆕 Nuevas traducciones para reviews
        'notifications.reviewReceived': 'New Review Received!',
        'notifications.reviewReceivedMsg': 'You received a {rating}-star review for "{productTitle}": "{comment}"',
        'notifications.reviewResponse': 'Response to Your Review',
        'notifications.reviewResponseMsg': 'The seller responded to your review for "{productTitle}"',
        'notifications.reviewHelpful': 'Review Marked as Helpful',
        'notifications.reviewHelpfulMsg': 'Your review for "{productTitle}" was marked as helpful by another user',
        'notifications.reviewWeeklyDigest': 'Weekly Review Summary',
        'notifications.reviewWeeklyDigestMsg': 'You received {count} new reviews this week with an average rating of {averageRating} stars',
        'notifications.reviewReminder': 'Review Reminder',
        'notifications.reviewReminderMsg': 'Don\'t forget to review "{productTitle}" from your recent purchase',
        'notifications.reviewMilestone': 'Review Milestone Reached!',
        'notifications.reviewMilestoneMsg': 'Congratulations! You\'ve reached {milestone} reviews with an average rating of {averageRating} stars',
      },
      es: {
        'notifications.orderCreated': '¡Orden Creada Exitosamente!',
        'notifications.orderCreatedMsg': 'Tu orden {orderNumber} ha sido creada. Procede al pago para recibir tus archivos.',
        'notifications.orderPaid': '¡Pago Confirmado!',
        'notifications.orderPaidMsg': 'Tu pago por la orden {orderNumber} ha sido procesado exitosamente. Estamos preparando tus archivos.',
        'notifications.orderCompleted': '¡Archivos Listos para Descarga!',
        'notifications.orderCompletedMsg': 'Tu orden {orderNumber} está completa. Ya puedes descargar tus archivos.',
        'notifications.productSold': '¡Nueva Venta!',
        'notifications.productSoldMsg': 'Has vendido {itemCount} producto(s) por un total de ${sellerAmount}.',
        'cart.buyerOnly': 'Solo los compradores pueden agregar productos al carrito',
        'cart.limitExceeded': 'Límite de carrito excedido (máximo 10 productos)',
        'cart.alreadyExists': 'El producto ya está en tu carrito',
        'cart.ownProduct': 'No puedes comprar tu propio producto',
        'cart.itemNotFound': 'Producto no encontrado en el carrito',
        // 🆕 Nuevas traducciones para reviews
        'notifications.reviewReceived': '¡Nueva Reseña Recibida!',
        'notifications.reviewReceivedMsg': 'Recibiste una reseña de {rating} estrellas para "{productTitle}": "{comment}"',
        'notifications.reviewResponse': 'Respuesta a Tu Reseña',
        'notifications.reviewResponseMsg': 'El vendedor respondió a tu reseña de "{productTitle}"',
        'notifications.reviewHelpful': 'Reseña Marcada como Útil',
        'notifications.reviewHelpfulMsg': 'Tu reseña de "{productTitle}" fue marcada como útil por otro usuario',
        'notifications.reviewWeeklyDigest': 'Resumen Semanal de Reseñas',
        'notifications.reviewWeeklyDigestMsg': 'Recibiste {count} nuevas reseñas esta semana con un promedio de {averageRating} estrellas',
        'notifications.reviewReminder': 'Recordatorio de Reseña',
        'notifications.reviewReminderMsg': 'No olvides reseñar "{productTitle}" de tu compra reciente',
        'notifications.reviewMilestone': '¡Hito de Reseñas Alcanzado!',
        'notifications.reviewMilestoneMsg': '¡Felicitaciones! Has alcanzado {milestone} reseñas con un promedio de {averageRating} estrellas',
      }
    };

    let text = translations[lang]?.[key] || translations['en'][key] || key;
    
    // Reemplazar variables
    if (args) {
      Object.keys(args).forEach(argKey => {
        text = text.replace(`{${argKey}}`, args[argKey]);
      });
    }
    
    return text;
  }

  /**
   * 🔄 MÉTODO EXISTENTE EXPANDIDO: Crear y enviar notificación
   */
  async createNotification(dto: CreateNotificationDto): Promise<void> {
    // Verificar preferencias del usuario antes de enviar
    const preferences = await this.getUserPreferences(dto.userId);
    
    if (!this.shouldSendNotification(dto.type, preferences)) {
      console.log(`Notification skipped due to user preferences: ${dto.type} for user ${dto.userId}`);
      return;
    }

    // Verificar horas de silencio
    if (this.isInQuietHours(preferences)) {
      // Programar para después de las horas de silencio
      await this.scheduleNotification({
        ...dto,
        scheduledFor: this.getNextAvailableTime(preferences).toISOString()
      });
      return;
    }

    // Crear notificación en BD
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data,
        orderId: dto.orderId,
        priority: dto.priority || NotificationPriority.NORMAL,
        channel: dto.channel,
        groupKey: dto.groupKey,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined
      }
    });

    // Enviar via WebSocket en tiempo real (si está habilitado)
    if (preferences.inAppEnabled) {
      this.webSocketGateway.sendToUser(dto.userId, 'notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        createdAt: notification.createdAt
      });
    }

    // Enviar email de forma asíncrona (si está habilitado)
    if (preferences.emailEnabled) {
      this.sendEmailNotification(notification).catch(error => {
        console.error('Error sending email notification:', error);
      });
    }

    // Registrar analytics
    await this.trackNotificationAnalytics(notification.id, dto.userId, dto.type, NotificationChannel.IN_APP);
  }

  /**
   * 🆕 NUEVO: Crear notificación programada
   */
  async scheduleNotification(dto: CreateScheduledNotificationDto): Promise<void> {
    await this.prisma.scheduledNotification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        scheduledFor: new Date(dto.scheduledFor),
        data: dto.data,
        maxAttempts: dto.maxAttempts || 3,
        orderId: dto.orderId,
        productId: dto.productId,
        reviewId: dto.reviewId
      }
    });
  }

  /**
   * 🆕 NUEVO: Gestión de preferencias de notificación
   */
  async updateNotificationPreferences(
    userId: string, 
    dto: UpdateNotificationPreferencesDto
  ): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...dto
      },
      update: dto
    });
  }

  /**
   * 🆕 NUEVO: Obtener preferencias de usuario
   */
  async getUserPreferences(userId: string) {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // Retornar preferencias por defecto si no existen
    return preferences || {
      emailEnabled: true,
      webPushEnabled: true,
      inAppEnabled: true,
      orderNotifications: true,
      paymentNotifications: true,
      reviewNotifications: true,
      marketingEmails: false,
      systemNotifications: true,
      reviewReceived: true,
      reviewResponses: true,
      reviewHelpfulVotes: true,
      reviewMilestones: true,
      reviewReminders: true,
      digestFrequency: DigestFrequency.WEEKLY,
      quietHoursEnabled: false,
      timezone: 'UTC'
    };
  }

  /**
   * 🆕 NUEVO: Verificar si debe enviar notificación según preferencias
   */
  private shouldSendNotification(type: NotificationType, preferences: any): boolean {
    // Verificar configuraciones generales
    if (type.startsWith('ORDER_') && !preferences.orderNotifications) return false;
    if (type.startsWith('PAYMENT_') && !preferences.paymentNotifications) return false;
    if (type.startsWith('REVIEW_') && !preferences.reviewNotifications) return false;
    if (type === 'SYSTEM_NOTIFICATION' && !preferences.systemNotifications) return false;

    // Verificar configuraciones específicas de reviews
    switch (type) {
      case NotificationType.REVIEW_RECEIVED:
        return preferences.reviewReceived;
      case NotificationType.REVIEW_RESPONSE_RECEIVED:
        return preferences.reviewResponses;
      case NotificationType.REVIEW_HELPFUL_VOTE:
        return preferences.reviewHelpfulVotes;
      case NotificationType.REVIEW_MILESTONE:
        return preferences.reviewMilestones;
      case NotificationType.REVIEW_PENDING_REMINDER:
        return preferences.reviewReminders;
      default:
        return true;
    }
  }

  /**
   * 🆕 NUEVO: Verificar horas de silencio
   */
  private isInQuietHours(preferences: any): boolean {
    if (!preferences.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = preferences.quietHoursStart || '22:00';
    const end = preferences.quietHoursEnd || '08:00';

    // Manejo de horas que cruzan medianoche
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  /**
   * 🆕 NUEVO: Obtener próximo horario disponible
   */
  private getNextAvailableTime(preferences: any): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endTime = preferences.quietHoursEnd || '08:00';
    const [hours, minutes] = endTime.split(':').map(Number);
    
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  }

  /**
   * 🆕 NUEVOS MÉTODOS PARA REVIEWS
   */

  /**
   * Notificación de review recibida
   */
  async sendReviewReceivedNotification(review: any, lang = 'en'): Promise<void> {
    await this.createNotification({
      userId: review.sellerId,
      type: NotificationType.REVIEW_RECEIVED,
      title: this.getTranslation('notifications.reviewReceived', lang),
      message: this.getTranslation('notifications.reviewReceivedMsg', lang, {
        rating: review.rating,
        productTitle: review.product?.title || 'Unknown Product',
        comment: review.comment?.substring(0, 100) + (review.comment?.length > 100 ? '...' : '')
      }),
      data: {
        reviewId: review.id,
        productId: review.productId,
        rating: review.rating,
        buyerName: review.buyer?.firstName + ' ' + review.buyer?.lastName
      },
      priority: NotificationPriority.HIGH,
      groupKey: `review_${review.productId}`
    });
  }

  /**
   * Notificación de respuesta a review
   */
  async sendReviewResponseNotification(review: any, response: any, lang = 'en'): Promise<void> {
    await this.createNotification({
      userId: review.buyerId,
      type: NotificationType.REVIEW_RESPONSE_RECEIVED,
      title: this.getTranslation('notifications.reviewResponse', lang),
      message: this.getTranslation('notifications.reviewResponseMsg', lang, {
        productTitle: review.product?.title || 'Unknown Product'
      }),
      data: {
        reviewId: review.id,
        responseId: response.id,
        productId: review.productId,
        sellerName: response.seller?.firstName + ' ' + response.seller?.lastName
      },
      priority: NotificationPriority.NORMAL,
      groupKey: `review_response_${review.id}`
    });
  }

  /**
   * Notificación de voto útil en review
   */
  async sendReviewHelpfulNotification(review: any, lang = 'en'): Promise<void> {
    await this.createNotification({
      userId: review.buyerId,
      type: NotificationType.REVIEW_HELPFUL_VOTE,
      title: this.getTranslation('notifications.reviewHelpful', lang),
      message: this.getTranslation('notifications.reviewHelpfulMsg', lang, {
        productTitle: review.product?.title || 'Unknown Product'
      }),
      data: {
        reviewId: review.id,
        productId: review.productId
      },
      priority: NotificationPriority.LOW,
      groupKey: `helpful_${review.id}`
    });
  }

  /**
   * 🆕 NUEVO: Enviar digest semanal de reviews
   */
  async sendReviewWeeklyDigest(dto: SendReviewDigestDto, lang = 'en'): Promise<void> {
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Obtener reviews del período
    const reviews = await this.prisma.review.findMany({
      where: {
        sellerId: dto.sellerId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'PUBLISHED'
      },
      include: {
        product: { select: { title: true } },
        buyer: { select: { firstName: true, lastName: true } }
      }
    });

    if (reviews.length === 0 && !dto.forceGenerate) {
      return; // No enviar digest vacío
    }

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    await this.createNotification({
      userId: dto.sellerId,
      type: NotificationType.REVIEW_WEEKLY_DIGEST,
      title: this.getTranslation('notifications.reviewWeeklyDigest', lang),
      message: this.getTranslation('notifications.reviewWeeklyDigestMsg', lang, {
        count: reviews.length,
        averageRating: averageRating.toFixed(1)
      }),
      data: {
        period: { startDate, endDate },
        reviewCount: reviews.length,
        averageRating,
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          productTitle: r.product?.title,
          buyerName: r.buyer?.firstName + ' ' + r.buyer?.lastName,
          comment: r.comment?.substring(0, 100)
        }))
      },
      priority: NotificationPriority.LOW,
      channel: NotificationChannel.EMAIL
    });
  }

  /**
   * 🆕 NUEVO: Cron job para digest automático
   */
  @Cron('0 9 * * 1') // Lunes a las 9 AM
  async sendWeeklyDigests(): Promise<void> {
    const sellers = await this.prisma.user.findMany({
      where: {
        role: 'SELLER',
        isActive: true
      },
      include: {
        notificationPreferences: true
      }
    });

    for (const seller of sellers) {
      const preferences = seller.notificationPreferences;
      
      if (preferences?.digestFrequency === DigestFrequency.WEEKLY) {
        await this.sendReviewWeeklyDigest({
          sellerId: seller.id,
          frequency: DigestFrequency.WEEKLY
        });
      }
    }
  }

  /**
   * 🆕 NUEVO: Procesar notificaciones programadas
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    
    const scheduledNotifications = await this.prisma.scheduledNotification.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: now
        },
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: now } }
        ]
      },
      take: 50 // Procesar máximo 50 por vez
    });

    for (const scheduled of scheduledNotifications) {
      try {
        await this.createNotification({
          userId: scheduled.userId,
          type: scheduled.type,
          title: scheduled.title,
          message: scheduled.message,
          data: scheduled.data as any,
          orderId: scheduled.orderId || undefined,
          productId: scheduled.productId || undefined
        });

        // Marcar como enviada
        await this.prisma.scheduledNotification.update({
          where: { id: scheduled.id },
          data: {
            status: 'sent',
            processedAt: now
          }
        });

      } catch (error) {
        console.error(`Error processing scheduled notification ${scheduled.id}:`, error);
        
        // Incrementar intentos
        const newAttempts = scheduled.attempts + 1;
        
        if (newAttempts >= scheduled.maxAttempts) {
          // Marcar como fallida
          await this.prisma.scheduledNotification.update({
            where: { id: scheduled.id },
            data: {
              status: 'failed',
              attempts: newAttempts,
              lastAttemptAt: now
            }
          });
        } else {
          // Programar reintento
          const nextAttempt = new Date(now.getTime() + Math.pow(2, newAttempts) * 60000); // Backoff exponencial
          
          await this.prisma.scheduledNotification.update({
            where: { id: scheduled.id },
            data: {
              attempts: newAttempts,
              lastAttemptAt: now,
              nextAttemptAt: nextAttempt
            }
          });
        }
      }
    }
  }

  /**
   * 🆕 NUEVO: Tracking de engagement
   */
  async trackEngagement(dto: TrackEngagementDto, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: dto.notificationId,
        userId
      }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const now = new Date();

    // Actualizar notificación según la acción
    const updateData: any = {};
    
    switch (dto.action) {
      case 'read':
        if (!notification.isRead) {
          updateData.isRead = true;
          updateData.readAt = now;
        }
        break;
      
      case 'clicked':
        updateData.clickedAt = now;
        updateData.clickCount = notification.clickCount + 1;
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.notification.update({
        where: { id: dto.notificationId },
        data: updateData
      });
    }

    // Registrar en analytics
    await this.trackNotificationAnalytics(
      dto.notificationId,
      userId,
      notification.type,
      NotificationChannel.IN_APP,
      {
        action: dto.action,
        deviceType: dto.deviceType,
        platform: dto.platform,
        userAgent: dto.userAgent
      }
    );
  }

  /**
   * 🆕 NUEVO: Registrar analytics de notificación
   */
  private async trackNotificationAnalytics(
    notificationId: string,
    userId: string,
    type: NotificationType,
    channel: NotificationChannel,
    metadata?: any
  ): Promise<void> {
    await this.prisma.notificationAnalytics.create({
      data: {
        userId,
        notificationId,
        type,
        channel,
        sent: true,
        sentAt: new Date(),
        deviceType: metadata?.deviceType,
        platform: metadata?.platform,
        userAgent: metadata?.userAgent,
        delivered: channel === NotificationChannel.IN_APP, // Asumimos entrega inmediata para in-app
        deliveredAt: channel === NotificationChannel.IN_APP ? new Date() : null,
        read: metadata?.action === 'read',
        readAt: metadata?.action === 'read' ? new Date() : null,
        clicked: metadata?.action === 'clicked',
        clickedAt: metadata?.action === 'clicked' ? new Date() : null
      }
    });
  }

  /**
   * 🔄 MÉTODO EXISTENTE MANTENIDO: Obtener notificaciones del usuario
   */
  async getUserNotifications(userId: string, filters: FilterNotificationsDto = {}) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(filters.type && { type: filters.type }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.channel && { channel: filters.channel }),
      ...(filters.isRead !== undefined && { isRead: filters.isRead }),
      ...(filters.groupKey && { groupKey: filters.groupKey }),
      ...(filters.startDate && filters.endDate && {
        createdAt: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        }
      }),
      // Filtrar notificaciones expiradas
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    const total = await this.prisma.notification.count({ where });

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      data: notifications,
      total,
      page,
      limit,
      unreadCount: await this.prisma.notification.count({
        where: { userId, isRead: false }
      })
    };
  }

  /**
   * 🔄 MÉTODOS EXISTENTES MANTENIDOS (sin cambios)
   */
  
  async sendOrderCreatedNotification(order: any, lang = 'en'): Promise<void> {
    await this.createNotification({
      userId: order.buyerId,
      type: NotificationType.ORDER_CREATED,
      title: this.getTranslation('notifications.orderCreated', lang),
      message: this.getTranslation('notifications.orderCreatedMsg', lang, { 
        orderNumber: order.orderNumber 
      }),
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount
      },
      orderId: order.id,
      priority: NotificationPriority.HIGH
    });
  }

  async sendOrderPaidNotification(order: any, lang = 'en'): Promise<void> {
    // Notificar al comprador
    await this.createNotification({
      userId: order.buyerId,
      type: NotificationType.ORDER_PAID,
      title: this.getTranslation('notifications.orderPaid', lang),
      message: this.getTranslation('notifications.orderPaidMsg', lang, { 
        orderNumber: order.orderNumber 
      }),
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount
      },
      orderId: order.id,
      priority: NotificationPriority.HIGH
    });
    
    const sellerIds: string[] = [...new Set(
      (order.items as any[]).map((item: any) => item.sellerId as string)
    )];

    // Notificar a cada seller
    for (const currentSellerId of sellerIds) {
      const sellerItems = order.items.filter((item: any) => item.sellerId === currentSellerId);
      const sellerAmount = sellerItems.reduce((sum: number, item: any) => sum + item.price, 0);

      await this.createNotification({
        userId: currentSellerId, 
        type: NotificationType.PRODUCT_SOLD,
        title: this.getTranslation('notifications.productSold', lang),
        message: this.getTranslation('notifications.productSoldMsg', lang, {
          itemCount: sellerItems.length,
          sellerAmount: sellerAmount.toFixed(2)
        }),
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          sellerAmount,
          itemCount: sellerItems.length,
          items: sellerItems.map((item: any) => ({
            productTitle: item.productTitle,
            price: item.price,
          }))
        },
        orderId: order.id,
        priority: NotificationPriority.HIGH
      });
    }
  }

  async sendOrderCompletedNotification(order: any, lang = 'en'): Promise<void> {
    await this.createNotification({
      userId: order.buyerId,
      type: NotificationType.ORDER_COMPLETED,
      title: this.getTranslation('notifications.orderCompleted', lang),
      message: this.getTranslation('notifications.orderCompletedMsg', lang, { 
        orderNumber: order.orderNumber 
      }),
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        downloadUrl: `${process.env.FRONTEND_URL}/orders/${order.id}/downloads`
      },
      orderId: order.id,
      priority: NotificationPriority.HIGH
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  /**
   * 🔄 MÉTODO EXISTENTE EXPANDIDO: Enviar email de notificación
   */
  private async sendEmailNotification(notification: any): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId }
    });

    if (!user) return;

    let emailTemplate: string;
    let emailData: any = {
      userName: `${user.firstName} ${user.lastName}`,
      title: notification.title,
      message: notification.message
    };

    switch (notification.type) {
      case NotificationType.ORDER_CREATED:
        emailTemplate = 'order-created';
        emailData = {
          ...emailData,
          orderNumber: notification.data?.orderNumber,
          totalAmount: notification.data?.totalAmount,
          paymentUrl: `${process.env.FRONTEND_URL}/orders/${notification.data?.orderId}/pay`
        };
        break;

      case NotificationType.ORDER_PAID:
        emailTemplate = 'order-paid';
        emailData = {
          ...emailData,
          orderNumber: notification.data?.orderNumber,
          totalAmount: notification.data?.totalAmount
        };
        break;

      case NotificationType.ORDER_COMPLETED:
        emailTemplate = 'order-completed';
        emailData = {
          ...emailData,
          orderNumber: notification.data?.orderNumber,
          downloadUrl: notification.data?.downloadUrl
        };
        break;

      case NotificationType.PRODUCT_SOLD:
        emailTemplate = 'product-sold';
        emailData = {
          ...emailData,
          orderNumber: notification.data?.orderNumber,
          sellerAmount: notification.data?.sellerAmount,
          itemCount: notification.data?.itemCount,
          items: notification.data?.items
        };
        break;

      // 🆕 NUEVOS TEMPLATES PARA REVIEWS
      case NotificationType.REVIEW_RECEIVED:
        emailTemplate = 'review-received';
        emailData = {
          ...emailData,
          rating: notification.data?.rating,
          productTitle: notification.data?.productTitle,
          buyerName: notification.data?.buyerName,
          reviewUrl: `${process.env.FRONTEND_URL}/products/${notification.data?.productId}/reviews`
        };
        break;

      case NotificationType.REVIEW_RESPONSE_RECEIVED:
        emailTemplate = 'review-response';
        emailData = {
          ...emailData,
          productTitle: notification.data?.productTitle,
          sellerName: notification.data?.sellerName,
          reviewUrl: `${process.env.FRONTEND_URL}/products/${notification.data?.productId}/reviews`
        };
        break;

      case NotificationType.REVIEW_WEEKLY_DIGEST:
        emailTemplate = 'review-weekly-digest';
        emailData = {
          ...emailData,
          reviewCount: notification.data?.reviewCount,
          averageRating: notification.data?.averageRating,
          reviews: notification.data?.reviews,
          dashboardUrl: `${process.env.FRONTEND_URL}/seller/dashboard/reviews`
        };
        break;

      case NotificationType.REVIEW_HELPFUL_VOTE:
        emailTemplate = 'review-helpful';
        emailData = {
          ...emailData,
          productTitle: notification.data?.productTitle,
          reviewUrl: `${process.env.FRONTEND_URL}/products/${notification.data?.productId}/reviews`
        };
        break;

      case NotificationType.REVIEW_MILESTONE:
        emailTemplate = 'review-milestone';
        emailData = {
          ...emailData,
          milestone: notification.data?.milestone,
          averageRating: notification.data?.averageRating,
          dashboardUrl: `${process.env.FRONTEND_URL}/seller/dashboard/reviews`
        };
        break;

      default:
        emailTemplate = 'generic-notification';
    }

    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: notification.title,
        template: emailTemplate,
        data: emailData
      });

      // Marcar email como enviado y registrar analytics
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailSent: true,
          sentAt: new Date()
        }
      });

      // Registrar en analytics de email
      await this.trackNotificationAnalytics(
        notification.id,
        notification.userId,
        notification.type,
        NotificationChannel.EMAIL
      );

    } catch (error) {
      console.error(`Error sending email notification ${notification.id}:`, error);
      // No lanzar error para que no afecte el flujo principal
    }
  }

  /**
   * 🆕 NUEVO: Obtener analytics de notificaciones
   */
  async getNotificationAnalytics(filters: NotificationAnalyticsDto): Promise<any> {
    const where: Prisma.NotificationAnalyticsWhereInput = {
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.type && { type: filters.type }),
      ...(filters.channel && { channel: filters.channel }),
      ...(filters.startDate && filters.endDate && {
        sentAt: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        }
      })
    };

    const groupBy = filters.groupBy || 'day';
    
    // Métricas básicas
    const totalSent = await this.prisma.notificationAnalytics.count({ where });
    const totalDelivered = await this.prisma.notificationAnalytics.count({
      where: { ...where, delivered: true }
    });
    const totalRead = await this.prisma.notificationAnalytics.count({
      where: { ...where, read: true }
    });
    const totalClicked = await this.prisma.notificationAnalytics.count({
      where: { ...where, clicked: true }
    });

    // Tasas de engagement
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;

    // Agrupación temporal
    let timeGrouping = {};
    if (groupBy === 'day') {
      const dailyStats = await this.prisma.$queryRaw`
        SELECT 
          DATE(sent_at) as date,
          COUNT(*) as sent,
          COUNT(CASE WHEN delivered = true THEN 1 END) as delivered,
          COUNT(CASE WHEN read = true THEN 1 END) as read,
          COUNT(CASE WHEN clicked = true THEN 1 END) as clicked
        FROM notification_analytics 
        WHERE ${filters.startDate ? `sent_at >= '${filters.startDate}'` : '1=1'}
          AND ${filters.endDate ? `sent_at <= '${filters.endDate}'` : '1=1'}
          ${filters.userId ? `AND user_id = '${filters.userId}'` : ''}
          ${filters.type ? `AND type = '${filters.type}'` : ''}
          ${filters.channel ? `AND channel = '${filters.channel}'` : ''}
        GROUP BY DATE(sent_at)
        ORDER BY date DESC
      `;
      timeGrouping = { daily: dailyStats };
    }

    // Agrupación por tipo de notificación
    const typeStats = await this.prisma.notificationAnalytics.groupBy({
      by: ['type'],
      where,
      _count: {
        _all: true
      }
    });

    // Agrupación por canal
    const channelStats = await this.prisma.notificationAnalytics.groupBy({
      by: ['channel'],
      where,
      _count: {
        _all: true
      }
    });

    return {
      summary: {
        totalSent,
        totalDelivered,
        totalRead,
        totalClicked,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100
      },
      timeGrouping,
      typeStats,
      channelStats
    };
  }

  /**
   * 🆕 NUEVO: Limpiar notificaciones expiradas
   */
  @Cron('0 0 * * *') // Diariamente a medianoche
  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date();
    
    // Marcar notificaciones expiradas como leídas
    await this.prisma.notification.updateMany({
      where: {
        expiresAt: { lt: now },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: now
      }
    });

    // Eliminar notificaciones muy antiguas (más de 90 días)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
        isRead: true
      }
    });

    console.log('Expired notifications cleanup completed');
  }

  /**
   * 🆕 NUEVO: Enviar recordatorios de review
   */
  async sendReviewReminders(): Promise<void> {
    // Buscar órdenes completadas hace 3 días sin reviews
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const ordersWithoutReviews = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(threeDaysAgo.getTime() - 24 * 60 * 60 * 1000), // Entre 3-4 días
          lte: threeDaysAgo
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        buyer: true,
        reviews: true
      }
    });

    for (const order of ordersWithoutReviews) {
      // Verificar si ya tiene reviews para todos los productos
      const productIds = order.items.map(item => item.productId);
      const reviewedProductIds = order.reviews.map(review => review.productId);
      const unreviewed = productIds.filter(id => !reviewedProductIds.includes(id));

      if (unreviewed.length > 0) {
        // Obtener preferencias del usuario
        const preferences = await this.getUserPreferences(order.buyerId);
        
        if (preferences.reviewReminders) {
          for (const productId of unreviewed) {
            const product = order.items.find(item => item.productId === productId)?.product;
            
            await this.scheduleNotification({
              userId: order.buyerId,
              type: NotificationType.REVIEW_PENDING_REMINDER,
              title: this.getTranslation('notifications.reviewReminder', 'en'),
              message: this.getTranslation('notifications.reviewReminderMsg', 'en', {
                productTitle: product?.title || 'Unknown Product'
              }),
              scheduledFor: new Date().toISOString(), // Enviar inmediatamente
              data: {
                orderId: order.id,
                productId,
                productTitle: product?.title
              }
            });
          }
        }
      }
    }
  }

  /**
   * 🆕 NUEVO: Detectar y notificar hitos de reviews
   */
  async checkReviewMilestones(sellerId: string): Promise<void> {
    const sellerRating = await this.prisma.sellerRating.findUnique({
      where: { sellerId }
    });

    if (!sellerRating) return;

    const milestones = [10, 25, 50, 100, 250, 500, 1000];
    const currentCount = sellerRating.totalReviews;

    // Verificar si acabamos de alcanzar un hito
    const reachedMilestone = milestones.find(milestone => 
      currentCount >= milestone && currentCount < milestone + 5 // Ventana de 5 reviews
    );

    if (reachedMilestone) {
      await this.createNotification({
        userId: sellerId,
        type: NotificationType.REVIEW_MILESTONE,
        title: this.getTranslation('notifications.reviewMilestone', 'en'),
        message: this.getTranslation('notifications.reviewMilestoneMsg', 'en', {
          milestone: reachedMilestone,
          averageRating: sellerRating.averageRating.toFixed(1)
        }),
        data: {
          milestone: reachedMilestone,
          totalReviews: currentCount,
          averageRating: sellerRating.averageRating
        },
        priority: NotificationPriority.HIGH
      });
    }
  }

  /**
   * Helper para obtener traducciones (para usar en otros servicios)
   */
  getTranslatedText(key: string, lang: string, args?: any): string {
    return this.getTranslation(key, lang, args);
  }
}