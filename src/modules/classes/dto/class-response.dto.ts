import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassStatus } from '../entities/class.entity';

export class ClassResponseDto {
  @ApiProperty({ description: 'Class ID' })
  id: string;

  @ApiProperty({ description: 'School ID the class belongs to' })
  schoolId: string;

  @ApiProperty({ description: 'Class name' })
  name: string;

  @ApiPropertyOptional({ description: 'Teacher ID assigned to this class', nullable: true })
  teacherId: string | null;

  @ApiPropertyOptional({ description: 'Program label (e.g., Pre-K, Toddler)', nullable: true })
  program: string | null;

  @ApiPropertyOptional({ description: 'Start date', type: String, format: 'date', nullable: true })
  startDate: Date | null;

  @ApiPropertyOptional({ description: 'End date', type: String, format: 'date', nullable: true })
  endDate: Date | null;

  @ApiPropertyOptional({ description: 'Maximum capacity', nullable: true })
  capacity: number | null;

  @ApiPropertyOptional({ description: 'Current enrollment count', nullable: true })
  currentEnrollment: number | null;

  @ApiPropertyOptional({ description: 'Age group label', nullable: true })
  ageGroup: string | null;

  @ApiProperty({ description: 'Enrollment status', enum: ClassStatus })
  status: ClassStatus;

  @ApiPropertyOptional({ description: 'Class description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: Date;
}




