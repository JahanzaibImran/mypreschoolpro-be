import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsInt, MaxLength, IsNotEmpty, Min } from 'class-validator';
import { ClassStatus } from '../entities/class.entity';

export class CreateClassDto {
  // Basic Information
  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({
    description: 'Class name',
    example: 'Preschool A',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Class description',
    example: 'Preschool class for children aged 3-4 years',
  })
  @IsString()
  @IsOptional()
  description?: string;

  // Age Group and Capacity
  @ApiPropertyOptional({
    description: 'Teacher ID assigned to this class',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional({
    description: 'Start date',
    example: '2024-09-01',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date',
    example: '2025-06-30',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Program label (e.g., Pre-K, Toddler)',
    example: 'Pre-K',
  })
  @IsString()
  @IsOptional()
  program?: string;

  @ApiPropertyOptional({
    description: 'Age group description',
    example: '3-4',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  ageGroup?: string;

  @ApiPropertyOptional({
    description: 'Maximum capacity (number of students)',
    example: 20,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  capacity?: number;

  // Status and Management
  @ApiPropertyOptional({
    description: 'Class status',
    enum: ClassStatus,
    default: ClassStatus.OPEN,
  })
  @IsEnum(ClassStatus)
  @IsOptional()
  status?: ClassStatus;

  // @ApiPropertyOptional({
  //   description: 'Class description',
  //   example: 'Preschool class for ages 3-4.',
  // })
  // @IsString()
  // @IsOptional()
  // description?: string;
}

