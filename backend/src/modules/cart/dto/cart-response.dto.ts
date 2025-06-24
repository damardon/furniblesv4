import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productTitle: string;

  @ApiProperty()
  productSlug: string;

  @ApiProperty()
  priceSnapshot: number;

  @ApiProperty()
  currentPrice: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  addedAt: Date;

  @ApiProperty()
  seller: {
    id: string;
    name: string;
    storeName: string;
  };

  @ApiProperty()
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    category: string;
    status: string;
    imageUrl?: string;
  };
}

export class CartSummaryDto {
  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  platformFeeRate: number;

  @ApiProperty()
  platformFee: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  feeBreakdown: {
    type: string;
    description: string;
    amount: number;
    rate?: number;
  }[];
}

export class CartResponseDto {
  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  summary: CartSummaryDto;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  updatedAt: Date;
}