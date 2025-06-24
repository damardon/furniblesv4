import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { NotificationType } from '@prisma/client';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * Función helper para traducciones
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
        'cart.itemNotFound': 'Item not found in cart'
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
        'cart.itemNotFound': 'Producto no encontrado en el carrito'
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
   * Crear y enviar notificación
   */
  async createNotification(dto: CreateNotificationDto): Promise<void> {
    // Crear notificación en BD
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data,
        orderId: dto.orderId
      }
    });

    // Enviar via WebSocket en tiempo real
    this.webSocketGateway.sendToUser(dto.userId, 'notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.createdAt
    });

    // Enviar email de forma asíncrona
    this.sendEmailNotification(notification).catch(error => {
      console.error('Error sending email notification:', error);
    });
  }

  /**
   * Notificación de orden creada
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
      orderId: order.id
    });
  }

  /**
   * Notificación de pago exitoso
   */
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
      orderId: order.id
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
        orderId: order.id
      });
    }
  }

  /**
   * Notificación de orden completada
   */
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
      orderId: order.id
    });
  }

  /**
   * Obtener notificaciones del usuario
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const total = await this.prisma.notification.count({
      where: { userId }
    });

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
   * Marcar notificación como leída
   */
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

  /**
   * Marcar todas las notificaciones como leídas
   */
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
   * Enviar email de notificación
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

      default:
        emailTemplate = 'generic-notification';
    }

    await this.emailService.sendEmail({
      to: user.email,
      subject: notification.title,
      template: emailTemplate,
      data: emailData
    });

    // Marcar email como enviado
    await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        emailSent: true,
        sentAt: new Date()
      }
    });
  }

  /**
   * Helper para obtener traducciones (para usar en otros servicios)
   */
  getTranslatedText(key: string, lang: string, args?: any): string {
    return this.getTranslation(key, lang, args);
  }
}