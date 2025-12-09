import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '../entities/enrollment.entity';

export class EnrollmentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the enrollment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Lead ID associated with the enrollment',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  leadId: string;

  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  schoolId: string;

  @ApiPropertyOptional({
    description: 'Class ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  classId: string | null;

  @ApiProperty({
    description: 'Program name',
    example: 'Preschool Program',
  })
  program: string;

  @ApiPropertyOptional({
    description: 'Enrollment start date',
    example: '2024-09-01',
    nullable: true,
  })
  startDate: Date | null;

  @ApiPropertyOptional({
    description: 'Enrollment end date',
    example: '2025-06-30',
    nullable: true,
  })
  endDate: Date | null;

  @ApiPropertyOptional({
    description: 'Tuition amount',
    example: 1200.0,
    nullable: true,
  })
  tuitionAmount: number | null;

  @ApiPropertyOptional({
    description: 'Registration fee',
    example: 150.0,
    nullable: true,
  })
  registrationFee: number | null;

  @ApiProperty({
    description: 'Enrollment status',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.ACTIVE,
  })
  status: EnrollmentStatus;

  @ApiPropertyOptional({
    description: 'Public notes',
    example: 'Family requested afternoon schedule.',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Timestamp when the enrollment was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the enrollment was last updated',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}