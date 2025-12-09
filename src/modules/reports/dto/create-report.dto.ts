import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsDateString, IsObject } from 'class-validator';

export class CreateReportDto {
  @ApiPropertyOptional({
    description: 'School ID (null for all schools)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  schoolId?: string | null;

  @ApiProperty({
    description: 'Report name',
    example: 'Monthly Enrollment Summary',
  })
  @IsString()
  @IsNotEmpty()
  reportName: string;

  @ApiProperty({
    description: 'Report type',
    example: 'enrollment',
    enum: ['enrollment', 'financial', 'operational'],
  })
  @IsString()
  @IsNotEmpty()
  reportType: string;

  @ApiProperty({
    description: 'File name',
    example: 'Monthly_Enrollment_Summary_2024-01-15.txt',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024,
  })
  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @ApiPropertyOptional({
    description: 'Date range start (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  dateRangeStart?: string | null;

  @ApiPropertyOptional({
    description: 'Date range end (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsOptional()
  dateRangeEnd?: string | null;

  @ApiPropertyOptional({
    description: 'Report metadata (JSON object)',
    example: { reportData: { totalStudents: 150 } },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> | null;
}







