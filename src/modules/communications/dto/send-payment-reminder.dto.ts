import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsNumber, IsDateString } from 'class-validator';

export enum RecipientType {
  PARENTS = 'parents',
  SCHOOL_OWNERS = 'school_owners',
}

export class SendPaymentReminderDto {
  @ApiProperty({
    description: 'Recipient type',
    enum: RecipientType,
    example: RecipientType.PARENTS,
  })
  @IsEnum(RecipientType)
  @IsNotEmpty()
  recipientType: RecipientType;

  @ApiPropertyOptional({
    description: 'Lead ID (optional, for sending to specific parent)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  leadId?: string;

  @ApiProperty({
    description: 'Payment amount',
    example: '150.00',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({
    description: 'Due date (YYYY-MM-DD)',
    example: '2024-03-15',
  })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiPropertyOptional({
    description: 'Additional message',
    example: 'Please make payment by the due date to avoid late fees.',
  })
  @IsString()
  @IsOptional()
  message?: string;
}











