import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsInt, Min, Max, IsDateString, MaxLength, IsEnum } from 'class-validator';
import { ActivityStatus } from '../entities/teacher-activity.entity';

export class UpdateTeacherActivityDto {
  @ApiPropertyOptional({ description: 'Activity title', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Activity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Activity type', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  activityType?: string;

  @ApiPropertyOptional({ description: 'Skill areas addressed', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillAreas?: string[];

  @ApiPropertyOptional({ description: 'Learning objectives' })
  @IsOptional()
  @IsString()
  learningObjectives?: string;

  @ApiPropertyOptional({ description: 'Materials used', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialsUsed?: string[];

  @ApiPropertyOptional({ description: 'Teacher reflection' })
  @IsOptional()
  @IsString()
  reflection?: string;

  @ApiPropertyOptional({ description: 'Date when activity was completed', format: 'date' })
  @IsOptional()
  @IsDateString()
  dateCompleted?: string;

  @ApiPropertyOptional({ description: 'Activity duration in minutes', minimum: 5, maximum: 180 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  duration?: number;

  @ApiPropertyOptional({ description: 'Activity status', enum: ActivityStatus })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ description: 'Tagged student enrollment IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taggedStudents?: string[];
}










