import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsInt, Min, Max, IsDateString, MaxLength, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ActivityStatus } from '../entities/teacher-activity.entity';

export class CreateTeacherActivityDto {
  @ApiProperty({ description: 'Activity title', example: 'Rainbow Color Mixing', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Activity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Activity type', example: 'Art & Crafts', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  activityType: string;

  @ApiPropertyOptional({ description: 'Skill areas addressed', type: [String], example: ['Creative Expression', 'Cognitive Skills'] })
  @Transform(({ value }) => {
    // Handle JSON string from FormData
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillAreas?: string[];

  @ApiPropertyOptional({ description: 'Learning objectives' })
  @IsOptional()
  @IsString()
  learningObjectives?: string;

  @ApiPropertyOptional({ description: 'Materials used', type: [String], example: ['Finger paints', 'Paper', 'Aprons'] })
  @Transform(({ value }) => {
    // Handle JSON string from FormData
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialsUsed?: string[];

  @ApiPropertyOptional({ description: 'Teacher reflection' })
  @IsOptional()
  @IsString()
  reflection?: string;

  @ApiPropertyOptional({ description: 'Date when activity was completed', format: 'date', default: 'today' })
  @IsOptional()
  @IsDateString()
  dateCompleted?: string;

  @ApiPropertyOptional({ description: 'Activity duration in minutes', example: 45, minimum: 5, maximum: 180, default: 30 })
  @Transform(({ value }) => {
    // Handle string from FormData
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 30 : parsed;
    }
    return typeof value === 'number' ? value : 30;
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  duration?: number;

  @ApiPropertyOptional({ description: 'Activity status', enum: ActivityStatus, default: ActivityStatus.DRAFT })
  @Transform(({ value }) => {
    // Handle string from FormData
    if (typeof value === 'string') {
      return value as ActivityStatus;
    }
    return value;
  })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ description: 'Tagged student enrollment IDs', type: [String] })
  @Transform(({ value }) => {
    // Handle JSON string from FormData
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taggedStudents?: string[];
}

