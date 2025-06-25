// src/modules/stripe/dto/create-connect-account.dto.ts
import { IsEmail, IsString, IsOptional, IsIn, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConnectAccountDto {
  @ApiProperty({
    description: 'Email address of the seller',
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
    description: 'ISO country code where the seller is located',
    example: 'US',
    enum: ['US', 'CA', 'MX', 'AR', 'CL', 'CO', 'PE', 'BR', 'GB', 'DE', 'FR', 'ES', 'IT'],
  })
  @IsString({ message: 'country.invalid' })
  @IsIn(['US', 'CA', 'MX', 'AR', 'CL', 'CO', 'PE', 'BR', 'GB', 'DE', 'FR', 'ES', 'IT'], {
    message: 'country.notSupported',
  })
  country: string;

  @ApiPropertyOptional({
    description: 'Type of business account',
    example: 'individual',
    enum: ['individual', 'company'],
    default: 'individual',
  })
  @IsOptional()
  @IsIn(['individual', 'company'], { message: 'businessType.invalid' })
  businessType?: 'individual' | 'company';

  @ApiPropertyOptional({
    description: 'Phone number of the seller',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString({ message: 'phone.invalid' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (for individual accounts)',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsString({ message: 'dateOfBirth.invalid' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Business name (for company accounts)',
    example: 'Acme Corporation',
  })
  @IsOptional()
  @IsString({ message: 'businessName.invalid' })
  @MaxLength(100, { message: 'businessName.tooLong' })
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Tax ID or SSN (last 4 digits)',
    example: '1234',
  })
  @IsOptional()
  @IsString({ message: 'taxId.invalid' })
  taxId?: string;
}