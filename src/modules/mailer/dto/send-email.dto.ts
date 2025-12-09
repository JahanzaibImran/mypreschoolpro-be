import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsArray, IsEnum, IsObject } from 'class-validator';

export enum EmailType {
  WELCOME = 'welcome',
  PAYMENT_INVOICE = 'payment_invoice',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_FAILURE = 'payment_failure',
  ACTIVITY_NOTIFICATION = 'activity_notification',
  LEAD_NOTIFICATION = 'lead_notification',
  SYSTEM_ALERT = 'system_alert',
  DOCUMENT_REMINDER = 'document_reminder',
  INVOICE_REMINDER = 'invoice_reminder',
  STAFF_INVITATION = 'staff_invitation',
}

export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address(es)',
    example: 'john.doe@example.com',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @IsEmail({}, { each: true })
  @IsString({ each: true })
  to: string | string[];

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to MyPreschoolPro!',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Email HTML content',
    example: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
  })
  @IsString()
  html: string;

  @ApiProperty({
    description: 'Email type for tracking and preferences',
    enum: EmailType,
    example: EmailType.WELCOME,
    required: false,
  })
  @IsEnum(EmailType)
  @IsOptional()
  emailType?: EmailType;

  @ApiProperty({
    description: 'User ID for preference checking',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'School ID for context',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsString()
  @IsOptional()
  schoolId?: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { enrollmentId: 'enr_123', studentName: 'John Doe' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Reply-to email address',
    example: 'support@mypreschoolpro.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  replyTo?: string;

  @ApiProperty({
    description: 'CC recipients',
    example: ['admin@mypreschoolpro.com'],
    required: false,
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  cc?: string[];

  @ApiProperty({
    description: 'BCC recipients',
    example: ['archive@mypreschoolpro.com'],
    required: false,
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  bcc?: string[];
}

