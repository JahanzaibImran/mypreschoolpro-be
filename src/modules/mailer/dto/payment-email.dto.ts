import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNumber, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum PaymentEmailType {
  INVOICE = 'invoice',
  CONFIRMATION = 'confirmation',
  REMINDER = 'reminder',
  FAILURE = 'failure',
}

export class SendPaymentEmailDto {
  @ApiProperty({
    description: 'Payment email type',
    enum: PaymentEmailType,
    example: PaymentEmailType.INVOICE,
  })
  @IsEnum(PaymentEmailType)
  type: PaymentEmailType;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'parent@example.com',
  })
  @IsEmail()
  recipientEmail: string;

  @ApiProperty({
    description: 'Recipient name',
    example: 'John Doe',
  })
  @IsString()
  recipientName: string;

  @ApiProperty({
    description: 'School name',
    example: 'Little Stars Preschool',
  })
  @IsString()
  schoolName: string;

  @ApiProperty({
    description: 'Payment amount in cents',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
    default: 'usd',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Invoice number',
    example: 'INV-2024-001',
    required: false,
  })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiProperty({
    description: 'Payment due date (ISO string)',
    example: '2024-02-01T00:00:00Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({
    description: 'Payment date (ISO string)',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentDate?: string;

  @ApiProperty({
    description: 'Payment URL for online payment',
    example: 'https://app.mypreschoolpro.com/payments/pay?id=pay_123',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentUrl?: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  schoolId: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { enrollmentId: 'enr_123', studentName: 'John Doe' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}


