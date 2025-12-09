import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject, IsBoolean } from 'class-validator';

export class CreateEmailAutomationRuleDto {
  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({
    description: 'Rule name',
    example: 'Send welcome email after tour',
  })
  @IsString()
  @IsNotEmpty()
  ruleName: string;

  @ApiProperty({
    description: 'Trigger event',
    example: 'lead_status_change',
  })
  @IsString()
  @IsNotEmpty()
  triggerEvent: string;

  @ApiProperty({
    description: 'Trigger conditions (JSON object)',
    example: { target_status: 'toured' },
  })
  @IsObject()
  @IsNotEmpty()
  triggerConditions: Record<string, any>;

  @ApiProperty({
    description: 'Email template ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  emailTemplateId: string;

  @ApiPropertyOptional({
    description: 'Is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}








