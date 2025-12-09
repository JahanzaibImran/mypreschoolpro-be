import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsBoolean, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateSkillProgressDto {
  @ApiProperty({ description: 'Student ID (enrollment ID)', format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Skill area category', example: 'Language Development', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  skillArea: string;

  @ApiProperty({ description: 'Specific skill name', example: 'Vocabulary', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  skillName: string;

  @ApiProperty({ description: 'Current skill level (1-5)', example: 3, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  currentLevel: number;

  @ApiProperty({ description: 'Target skill level (1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  targetLevel: number;

  @ApiProperty({ description: 'Observation notes about the student\'s progress' })
  @IsString()
  @IsNotEmpty()
  observation: string;

  @ApiPropertyOptional({ description: 'Whether a milestone was achieved', default: false })
  @IsOptional()
  @IsBoolean()
  milestoneAchieved?: boolean;

  @ApiPropertyOptional({ description: 'Date when progress was recorded', format: 'date', default: 'today' })
  @IsOptional()
  @IsDateString()
  recordedDate?: string;

  @ApiPropertyOptional({ description: 'Next steps for continued development' })
  @IsOptional()
  @IsString()
  nextSteps?: string;
}










