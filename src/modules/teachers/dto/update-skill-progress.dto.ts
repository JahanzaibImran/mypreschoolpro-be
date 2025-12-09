import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsBoolean, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class UpdateSkillProgressDto {
  @ApiPropertyOptional({ description: 'Skill area category', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  skillArea?: string;

  @ApiPropertyOptional({ description: 'Specific skill name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  skillName?: string;

  @ApiPropertyOptional({ description: 'Current skill level (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  currentLevel?: number;

  @ApiPropertyOptional({ description: 'Target skill level (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  targetLevel?: number;

  @ApiPropertyOptional({ description: 'Observation notes about the student\'s progress' })
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiPropertyOptional({ description: 'Whether a milestone was achieved' })
  @IsOptional()
  @IsBoolean()
  milestoneAchieved?: boolean;

  @ApiPropertyOptional({ description: 'Date when progress was recorded', format: 'date' })
  @IsOptional()
  @IsDateString()
  recordedDate?: string;

  @ApiPropertyOptional({ description: 'Next steps for continued development' })
  @IsOptional()
  @IsString()
  nextSteps?: string;
}








