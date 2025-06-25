import { IsString, IsNumber, IsBoolean, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StripeRequestDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;
}

export class StripeEventDataDto {
  @IsObject()
  object: any;

  @IsOptional()
  @IsObject()
  previous_attributes?: any;
}

export class StripeWebhookDto {
  @IsString()
  id: string;

  @IsString()
  object: string;

  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => StripeEventDataDto)
  data: StripeEventDataDto;

  @IsNumber()
  created: number;

  @IsBoolean()
  livemode: boolean;

  @IsNumber()
  pending_webhooks: number;

  @ValidateNested()
  @Type(() => StripeRequestDto)
  request: StripeRequestDto;

  @IsOptional()
  @IsString()
  api_version?: string;
}
