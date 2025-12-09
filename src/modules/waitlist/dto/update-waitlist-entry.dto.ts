import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateWaitlistEntryDto {
  @ApiPropertyOptional({
    description: 'Notes about this waitlist entry',
    example: 'Parent prefers morning schedule. Sibling enrolled.',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Priority score (1-10, higher = more priority)',
    minimum: 1,
    maximum: 10,
    example: 7,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  priorityScore?: number;
}









