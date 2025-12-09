import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class AnalyzeWaitlistLeadDto {
  @ApiProperty({
    description: 'Lead ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  leadId: string;

  @ApiPropertyOptional({
    description: 'Child name',
    example: 'Emma Doe',
  })
  @IsString()
  @IsOptional()
  childName?: string;

  @ApiPropertyOptional({
    description: 'Parent name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  parentName?: string;

  @ApiPropertyOptional({
    description: 'Current lead status',
    example: 'waitlisted',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Lead priority label (e.g., High, Sibling, Standard)',
    example: 'High',
  })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({
    description: 'Available spots for the program the lead is waiting for',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  availableSpots?: number;

  @ApiPropertyOptional({
    description: 'Next follow up date',
    example: '2024-01-25',
  })
  @IsString()
  @IsOptional()
  nextFollowUp?: string;

  @ApiPropertyOptional({
    description: 'Lead score used for prioritization',
    example: 95,
  })
  @IsNumber()
  @IsOptional()
  leadScore?: number;
}

export class LeadAnalysisResponseDto {
  @ApiProperty({
    description: 'Summary of the analysis',
    example: 'High-priority lead with tour scheduled. Follow up within 2 days.',
  })
  summary: string;

  @ApiProperty({
    description: 'Recommended actions',
    example: ['Schedule follow-up call within 48 hours', 'Send personalized tour recap email'],
    type: [String],
  })
  recommendations: string[];

  @ApiPropertyOptional({
    description: 'Computed priority score between 0-100',
    example: 82,
    nullable: true,
  })
  priorityScore?: number;
}










