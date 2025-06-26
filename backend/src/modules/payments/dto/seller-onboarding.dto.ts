import { IsEmail, IsString, IsOptional, IsIn, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SellerOnboardingDto {
  @ApiProperty({
    description: 'Seller email address',
    example: 'seller@example.com',
  })
  @IsEmail({}, { message: 'email.invalid' })
  email: string;

  @ApiProperty({
    description: 'First name of the seller',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'firstName.invalid' })
  @MinLength(2, { message: 'firstName.tooShort' })
  @MaxLength(50, { message: 'firstName.tooLong' })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the seller',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'lastName.invalid' })
  @MinLength(2, { message: 'lastName.tooShort' })
  @MaxLength(50, { message: 'lastName.tooLong' })
  lastName: string;

  @ApiProperty({
    description: 'Country code where seller operates',
    example: 'US',
    enum: ['US', 'CA', 'MX', 'AR', 'CL', 'CO', 'PE', 'BR', 'GB', 'DE', 'FR', 'ES', 'IT'],
  })
  @IsString({ message: 'country.invalid' })
  @IsIn(['US', 'CA', 'MX', 'AR', 'CL', 'CO', 'PE', 'BR', 'GB', 'DE', 'FR', 'ES', 'IT'], {
    message: 'country.notSupported',
  })
  country: string;

  @ApiPropertyOptional({
    description: 'Store name for the seller',
    example: 'Modern Furniture Co.',
  })
  @IsOptional()
  @IsString({ message: 'storeName.invalid' })
  @MaxLength(100, { message: 'storeName.tooLong' })
  storeName?: string;

  @ApiPropertyOptional({
    description: 'Business website URL',
    example: 'https://modernfurniture.com',
  })
  @IsOptional()
  @IsString({ message: 'website.invalid' })
  website?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString({ message: 'phone.invalid' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Business type',
    example: 'individual',
    enum: ['individual', 'company'],
    default: 'individual',
  })
  @IsOptional()
  @IsIn(['individual', 'company'], { message: 'businessType.invalid' })
  businessType?: 'individual' | 'company';

  @ApiPropertyOptional({
    description: 'Agree to terms and conditions',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'agreeToTerms.invalid' })
  agreeToTerms?: boolean;

  @ApiPropertyOptional({
    description: 'Enable automatic payouts',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'automaticPayouts.invalid' })
  automaticPayouts?: boolean;
}