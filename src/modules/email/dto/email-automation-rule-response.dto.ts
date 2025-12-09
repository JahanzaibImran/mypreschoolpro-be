import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailAutomationRuleResponseDto {
  @ApiProperty({ description: 'Rule ID' })
  id: string;

  @ApiProperty({ description: 'School ID' })
  schoolId: string;

  @ApiProperty({ description: 'Rule name' })
  ruleName: string;

  @ApiProperty({ description: 'Trigger event' })
  triggerEvent: string;

  @ApiProperty({ description: 'Trigger conditions' })
  triggerConditions: Record<string, any>;

  @ApiPropertyOptional({ description: 'Email template ID' })
  emailTemplateId: string | null;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy: string | null;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Email template information' })
  emailTemplate?: {
    id: string;
    name: string;
  } | null;
}








