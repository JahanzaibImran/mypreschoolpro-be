import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportResponseDto {
  @ApiProperty({
    description: 'Report ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  schoolId: string | null;

  @ApiProperty({
    description: 'Created by user ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Report name',
    example: 'Monthly Enrollment Summary',
  })
  reportName: string;

  @ApiProperty({
    description: 'Report type',
    example: 'enrollment',
  })
  reportType: string;

  @ApiProperty({
    description: 'File name',
    example: 'Monthly_Enrollment_Summary_2024-01-15.txt',
  })
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024,
  })
  fileSize: number;

  @ApiPropertyOptional({
    description: 'Date range start',
    example: '2024-01-01',
  })
  dateRangeStart: string | null;

  @ApiPropertyOptional({
    description: 'Date range end',
    example: '2024-01-31',
  })
  dateRangeEnd: string | null;

  @ApiPropertyOptional({
    description: 'Report metadata',
    example: { reportData: { totalStudents: 150 } },
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: string;
}







