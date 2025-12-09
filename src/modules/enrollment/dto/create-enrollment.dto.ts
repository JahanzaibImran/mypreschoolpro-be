import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString, MaxLength, IsEnum, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { EnrollmentStatus } from '../entities/enrollment.entity';

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'Lead ID associated with this enrollment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({
    description: 'Program the student is enrolling in',
    example: 'Preschool Program',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  program: string;

  @ApiPropertyOptional({
    description: 'Class ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Enrollment start date',
    example: '2024-09-01',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Enrollment end date',
    example: '2025-06-30',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Tuition amount',
    example: 1200.0,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tuitionAmount?: number;

  @ApiPropertyOptional({
    description: 'Registration fee',
    example: 150.0,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  registrationFee?: number;

  @ApiPropertyOptional({
    description: 'Enrollment status',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE,
  })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @ApiPropertyOptional({
    description: 'Public notes about the enrollment',
    example: 'Family requested afternoon schedule.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}




