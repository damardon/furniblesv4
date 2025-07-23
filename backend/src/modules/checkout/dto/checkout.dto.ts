import { IsEmail, IsOptional, IsObject, IsArray, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({
    description: 'Email del comprador para recibir los archivos',
    example: 'buyer@example.com'
  })
  @IsEmail()
  buyerEmail: string;

  @ApiProperty({
    description: 'URL de éxito después del pago',
    required: false,
    default: 'https://probable-barnacle-65wp9jg5qwxc5w6-3000.app.github.dev/orders/success'
  })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiProperty({
    description: 'URL de cancelación',
    required: false,
    default: 'https://probable-barnacle-65wp9jg5qwxc5w6-3000.app.github.dev/cart'
  })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;

  @ApiProperty({
    description: 'Datos de facturación',
    required: false
  })
  @IsOptional()
  @IsObject()
  billingData?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
  };

  @ApiProperty({
    description: 'IDs específicos de productos del carrito a comprar (opcional)',
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}

export class CheckoutResponseDto {
  @ApiProperty({
    description: 'ID de la orden creada'
  })
  orderId: string;

  @ApiProperty({
    description: 'Número único de la orden'
  })
  orderNumber: string;

  @ApiProperty({
    description: 'URL de Stripe Checkout para proceder al pago'
  })
  checkoutUrl: string;

  @ApiProperty({
    description: 'ID del Payment Intent de Stripe'
  })
  paymentIntentId: string;

  @ApiProperty({
    description: 'Monto total a pagar'
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Fecha y hora de expiración del checkout'
  })
  expiresAt: Date;
}

export class CheckoutDetailsDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  platformFee: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  buyerEmail: string;

  @ApiProperty()
  items: CheckoutItemDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  paymentIntentId?: string;
}

export class CheckoutItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productTitle: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  product: {
    id: string;
    title: string;
    slug: string;
    category: string;
    imageUrl?: string;
  };
}

export class CheckoutAnalyticsDto {
  @ApiProperty()
  totalCheckouts: number;

  @ApiProperty()
  completedCheckouts: number;

  @ApiProperty()
  cancelledCheckouts: number;

  @ApiProperty()
  pendingCheckouts: number;

  @ApiProperty()
  conversionRate: number;

  @ApiProperty()
  avgCheckoutValue: number;
}