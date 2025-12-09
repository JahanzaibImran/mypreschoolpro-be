import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsArray, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { LessonPlanStatus } from '../entities/lesson-plan.entity';

export class CreateLessonPlanDto {
  @ApiProperty({ description: 'Lesson title', example: 'Colors and Shapes Discovery', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Subject area', example: 'Art', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject: string;

  @ApiProperty({ description: 'Date of the lesson', example: '2025-11-25', format: 'date' })
  @IsDateString()
  lessonDate: string;

  @ApiProperty({ description: 'Learning objectives', example: 'Students will be able to identify primary colors and basic shapes.' })
  @IsString()
  @IsNotEmpty()
  objectives: string;

  @ApiProperty({ description: 'Materials needed', type: [String], example: ['Colored paper', 'Scissors', 'Glue sticks'] })
  @IsArray()
  @IsString({ each: true })
  materials: string[];

  @ApiPropertyOptional({ description: 'Activities and procedures', example: 'Circle time introduction, hands-on activity, collaborative project' })
  @IsOptional()
  @IsString()
  activities?: string;

  @ApiPropertyOptional({ description: 'Assessment methods', example: 'Observe students during activity, review completed work' })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Focus on hands-on learning' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Lesson duration in minutes', example: 45, minimum: 15, maximum: 180, default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(180)
  duration?: number;

  @ApiPropertyOptional({ description: 'Target age group', example: '3-4 years', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ageGroup?: string;

  @ApiPropertyOptional({ description: 'Class ID (optional, will use teacher\'s first class if not provided)', format: 'uuid' })
  @IsOptional()
  @IsString()
  classId?: string;
}









