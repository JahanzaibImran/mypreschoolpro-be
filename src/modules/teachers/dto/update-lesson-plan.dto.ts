import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsArray, IsOptional, IsNumber, Min, Max, MaxLength, IsEnum } from 'class-validator';
import { LessonPlanStatus } from '../entities/lesson-plan.entity';

export class UpdateLessonPlanDto {
  @ApiPropertyOptional({ description: 'Lesson title', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Subject area', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({ description: 'Date of the lesson', format: 'date' })
  @IsOptional()
  @IsDateString()
  lessonDate?: string;

  @ApiPropertyOptional({ description: 'Learning objectives' })
  @IsOptional()
  @IsString()
  objectives?: string;

  @ApiPropertyOptional({ description: 'Materials needed', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @ApiPropertyOptional({ description: 'Activities and procedures' })
  @IsOptional()
  @IsString()
  activities?: string;

  @ApiPropertyOptional({ description: 'Assessment methods' })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Lesson duration in minutes', minimum: 15, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(180)
  duration?: number;

  @ApiPropertyOptional({ description: 'Target age group', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ageGroup?: string;

  @ApiPropertyOptional({ description: 'Lesson status', enum: LessonPlanStatus })
  @IsOptional()
  @IsEnum(LessonPlanStatus)
  status?: LessonPlanStatus;
}










