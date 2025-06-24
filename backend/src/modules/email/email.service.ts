import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailData {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const emailConfig = {
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const htmlContent = this.generateEmailHTML(emailData.template, emailData.data);
      
      const mailOptions = {
        from: emailData.from || this.configService.get('SMTP_FROM', 'noreply@furnibles.com'),
        to: emailData.to,
        subject: emailData.subject,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${emailData.to}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailData.to}:`, error);
      return false;
    }
  }

  private generateEmailHTML(template: string, data: Record<string, any>): string {
    // Templates básicos para las notificaciones
    const templates = {
      'order-created': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Orden Creada Exitosamente!</h2>
          <p>Hola ${data.userName},</p>
          <p>Tu orden <strong>${data.orderNumber}</strong> ha sido creada exitosamente.</p>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3>Detalles de la orden:</h3>
            <p><strong>Número de orden:</strong> ${data.orderNumber}</p>
            <p><strong>Total a pagar:</strong> ${data.totalAmount}</p>
          </div>
          <p>Para completar tu compra, haz clic en el siguiente enlace:</p>
          <a href="${data.paymentUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Proceder al Pago</a>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Saludos,<br>El equipo de Furnibles</p>
        </div>
      `,
      
      'order-paid': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Pago Confirmado!</h2>
          <p>Hola ${data.userName},</p>
          <p>Tu pago por la orden <strong>${data.orderNumber}</strong> ha sido procesado exitosamente.</p>
          <div style="background: #d4edda; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3>✅ Pago Confirmado</h3>
            <p><strong>Orden:</strong> ${data.orderNumber}</p>
            <p><strong>Total pagado:</strong> ${data.totalAmount}</p>
          </div>
          <p>Estamos preparando tus archivos para descarga. Te notificaremos cuando estén listos.</p>
          <p>Saludos,<br>El equipo de Furnibles</p>
        </div>
      `,
      
      'order-completed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Archivos Listos para Descarga!</h2>
          <p>Hola ${data.userName},</p>
          <p>Tu orden <strong>${data.orderNumber}</strong> está completa y tus archivos están listos para descarga.</p>
          <div style="background: #d1ecf1; padding: 20px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3>📁 Descarga tus Archivos</h3>
            <p>Puedes descargar tus archivos haciendo clic en el siguiente enlace:</p>
            <a href="${data.downloadUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Descargar Archivos</a>
          </div>
          <p><strong>Importante:</strong> Los enlaces de descarga son válidos por 30 días y están limitados a 5 descargas por archivo.</p>
          <p>¡Gracias por tu compra!</p>
          <p>Saludos,<br>El equipo de Furnibles</p>
        </div>
      `,
      
      'product-sold': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Nueva Venta Realizada! 🎉</h2>
          <p>Hola ${data.userName},</p>
          <p>¡Felicitaciones! Has realizado una nueva venta.</p>
          <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3>💰 Detalles de la Venta</h3>
            <p><strong>Orden:</strong> ${data.orderNumber}</p>
            <p><strong>Productos vendidos:</strong> ${data.itemCount}</p>
            <p><strong>Tu ganancia:</strong> ${data.sellerAmount}</p>
          </div>
          ${data.items ? `
            <h4>Productos vendidos:</h4>
            <ul>
              ${data.items.map(item => `<li>${item.productTitle} - ${item.price}</li>`).join('')}
            </ul>
          ` : ''}
          <p>El pago será procesado según nuestros términos y condiciones.</p>
          <p>¡Sigue así!</p>
          <p>Saludos,<br>El equipo de Furnibles</p>
        </div>
      `,
      
      'generic-notification': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${data.title}</h2>
          <p>Hola ${data.userName},</p>
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <p>${data.message}</p>
          </div>
          <p>Saludos,<br>El equipo de Furnibles</p>
        </div>
      `
    };

    return templates[template] || templates['generic-notification'];
  }
}