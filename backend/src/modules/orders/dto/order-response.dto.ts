import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productTitle: string;

  @ApiProperty()
  productSlug: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  sellerName: string;

  @ApiProperty()
  storeName: string;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  status: OrderStatus;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  platformFeeRate: number;

  @ApiProperty()
  platformFee: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  sellerAmount: number;

  @ApiProperty()
  buyerEmail: string;

  @ApiProperty()
  paymentIntentId?: string;

  @ApiProperty()
  paymentStatus?: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  buyer: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  paidAt?: Date;

  @ApiProperty()
  completedAt?: Date;

  @ApiProperty()
  feeBreakdown?: any;
}
