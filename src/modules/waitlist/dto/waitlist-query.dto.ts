import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class WaitlistQueryDto {
  @ApiProperty({
    description: 'Page number (1-indexed)',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 100,
    required: false,
    default: 100,
    maximum: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({
    description: 'Filter by school ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({
    description: 'Comma-separated list of school IDs (for school owners with multiple schools)',
    example: '123e4567-e89b-12d3-a456-426614174000,456e7890-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsString()
  schoolIds?: string;

  @ApiProperty({
    description: 'Filter by program name (case-insensitive partial match)',
    example: 'Pre-K',
    required: false,
  })
  @IsOptional()
  @IsString()
  program?: string;

  @ApiProperty({
    description: 'Filter by waitlist status',
    example: 'active',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Search by child name, parent name, or parent email (case-insensitive partial match)',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Field to sort by',
    example: 'priority',
    enum: ['priority', 'date'],
    required: false,
    default: 'priority',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
    required: false,
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}

