// backend/src/modules/payments/paypal.service.ts - UBICACIÓN CORRECTA
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PayPalAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface PayPalOrderRequest {
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  metadata?: Record<string, string>;
}

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 🔐 Obtener token de acceso de PayPal
   */
  private async getAccessToken(): Promise<string> {
    // Verificar si tenemos un token válido
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const clientId = this.configService.get('PAYPAL_CLIENT_ID');
      const clientSecret = this.configService.get('PAYPAL_CLIENT_SECRET');
      const baseUrl = this.configService.get('PAYPAL_BASE_URL', 'https://api.sandbox.paypal.com');

      if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured');
      }

      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`PayPal auth failed: ${response.status}`);
      }

      const data: PayPalAccessTokenResponse = await response.json();
      
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      
      this.logger.log('PayPal access token obtained successfully');
      return this.accessToken;

    } catch (error) {
      this.logger.error(`Failed to get PayPal access token: ${error.message}`);
      throw new BadRequestException('Failed to authenticate with PayPal');
    }
  }

  /**
   * 🛒 Crear orden de PayPal
   */
  async createOrder(orderRequest: PayPalOrderRequest): Promise<{
    orderId: string;
    approvalUrl: string;
    status: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();
      const baseUrl = this.configService.get('PAYPAL_BASE_URL', 'https://api.sandbox.paypal.com');

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: orderRequest.currency.toUpperCase(),
            value: orderRequest.amount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: orderRequest.currency.toUpperCase(),
                value: orderRequest.amount.toFixed(2)
              }
            }
          },
          items: orderRequest.items.map(item => ({
            name: item.name,
            unit_amount: {
              currency_code: orderRequest.currency.toUpperCase(),
              value: item.price.toFixed(2)
            },
            quantity: (item.quantity || 1).toString(),
            category: 'DIGITAL_GOODS'
          }))
        }],
        application_context: {
          return_url: `${this.configService.get('FRONTEND_URL')}/checkout/success`,
          cancel_url: `${this.configService.get('FRONTEND_URL')}/checkout/error`,
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          brand_name: 'Furnibles'
        }
      };

      const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal order creation failed: ${JSON.stringify(errorData)}`);
      }

      const order = await response.json();
      const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;

      if (!approvalUrl) {
        throw new Error('No approval URL received from PayPal');
      }

      this.logger.log(`PayPal order created: ${order.id}`);

      return {
        orderId: order.id,
        approvalUrl,
        status: order.status
      };

    } catch (error) {
      this.logger.error(`Failed to create PayPal order: ${error.message}`);
      throw new BadRequestException(`Failed to create PayPal order: ${error.message}`);
    }
  }

  /**
   * 💰 Capturar pago de PayPal
   */
  async captureOrder(orderId: string): Promise<{
    paymentId: string;
    status: string;
    amount: number;
    currency: string;
    payerEmail?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();
      const baseUrl = this.configService.get('PAYPAL_BASE_URL', 'https://api.sandbox.paypal.com');

      const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal capture failed: ${JSON.stringify(errorData)}`);
      }

      const captureData = await response.json();
      const capture = captureData.purchase_units[0].payments.captures[0];

      this.logger.log(`PayPal order captured: ${orderId}`);

      return {
        paymentId: capture.id,
        status: capture.status,
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
        payerEmail: captureData.payer.email_address
      };

    } catch (error) {
      this.logger.error(`Failed to capture PayPal order: ${error.message}`);
      throw new BadRequestException(`Failed to capture PayPal payment: ${error.message}`);
    }
  }

  /**
   * 📋 Obtener detalles de orden
   */
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const baseUrl = this.configService.get('PAYPAL_BASE_URL', 'https://api.sandbox.paypal.com');

      const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get PayPal order details: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      this.logger.error(`Failed to get PayPal order details: ${error.message}`);
      throw new BadRequestException(`Failed to get order details: ${error.message}`);
    }
  }

  /**
   * 🔍 Verificar webhook de PayPal (implementación básica)
   */
  verifyWebhook(body: any, headers: any): boolean {
    // TODO: Implementar verificación real de webhook PayPal
    // Por ahora retornamos true para desarrollo
    this.logger.warn('PayPal webhook verification not fully implemented');
    return true;
  }

  /**
   * 🧪 Test de conectividad con PayPal
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getAccessToken();
      return {
        success: true,
        message: 'PayPal connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `PayPal connection failed: ${error.message}`
      };
    }
  }
}