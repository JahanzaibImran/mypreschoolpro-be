import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsInt, Min, Max, IsDateString, IsString } from 'class-validator';
import { LeadStatus } from '../entities/lead.entity';

export class UpdateLeadDetailsDto {
  @ApiPropertyOptional({
    description: 'Lead status',
    enum: LeadStatus,
  })
  @IsEnum(LeadStatus)
  @IsOptional()
  lead_status?: LeadStatus;

  @ApiPropertyOptional({
    description: 'Urgency level',
    enum: ['low', 'medium', 'high'],
    example: 'medium',
  })
  @IsString()
  @IsOptional()
  urgency?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({
    description: 'Lead rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  lead_rating?: number;

  @ApiPropertyOptional({
    description: 'User ID of staff member assigned to this lead',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  assigned_to?: string | null;

  @ApiPropertyOptional({
    description: 'Follow-up date',
    example: '2024-01-20T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  follow_up_date?: string | null;
}


