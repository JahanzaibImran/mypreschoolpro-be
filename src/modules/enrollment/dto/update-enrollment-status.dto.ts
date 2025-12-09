import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { EnrollmentStatus } from '../entities/enrollment.entity';

export class UpdateEnrollmentStatusDto {
  @ApiProperty({
    description: 'Enrollment status',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.ACTIVE,
  })
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus;

  @ApiPropertyOptional({
    description: 'Enrollment end date (optional, can be set when updating status)',
    example: '2025-06-30',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}




