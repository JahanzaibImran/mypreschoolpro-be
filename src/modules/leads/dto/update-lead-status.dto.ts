import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { LeadStatus } from '../entities/lead.entity';

export class UpdateLeadStatusDto {
  @ApiProperty({
    description: 'Lead status',
    enum: LeadStatus,
    example: LeadStatus.CONTACTED,
  })
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @ApiPropertyOptional({
    description: 'Follow-up date (optional, can be set when updating status)',
    example: '2024-01-20',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}

