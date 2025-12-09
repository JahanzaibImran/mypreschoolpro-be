import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class UpsertProgressDto {
  @ApiProperty({
    description: 'Student ID (actually lead_id from enrollment)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  studentId: string;

  @ApiProperty({
    description: 'Subject name',
    example: 'Mathematics',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage: number;

  @ApiPropertyOptional({
    description: 'Letter grade (A, B, C, D, F format)',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({
    description: 'Teacher comments',
    example: 'Showing great improvement in problem-solving skills',
  })
  @IsOptional()
  @IsString()
  teacherComments?: string;
}








