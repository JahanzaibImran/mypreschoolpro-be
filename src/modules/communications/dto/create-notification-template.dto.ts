import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class CreateNotificationTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Payment Reminder',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Payment Reminder for {{child_name}}',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Email content',
    example: 'Dear {{parent_name}}, this is a reminder about payment for {{child_name}}...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Template type',
    example: 'payment_reminder',
    enum: ['system', 'user', 'school', 'payment', 'security'],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({
    description: 'Template variables (JSON object)',
    example: { parent_name: 'Parent Name', child_name: 'Child Name', amount: 'Amount' },
  })
  @IsObject()
  @IsOptional()
  variables?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Attachment URL',
  })
  @IsString()
  @IsOptional()
  attachmentUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Attachment name',
  })
  @IsString()
  @IsOptional()
  attachmentName?: string | null;
}











