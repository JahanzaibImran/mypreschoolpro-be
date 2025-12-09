import { ApiProperty } from '@nestjs/swagger';

export class SkillProgressResponseDto {
  @ApiProperty({ description: 'Progress record ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Student ID (enrollment ID)', format: 'uuid' })
  studentId: string;

  @ApiProperty({ description: 'Student name' })
  studentName: string;

  @ApiProperty({ description: 'Teacher ID', format: 'uuid' })
  teacherId: string;

  @ApiProperty({ description: 'Skill area category', example: 'Language Development' })
  skillArea: string;

  @ApiProperty({ description: 'Specific skill name', example: 'Vocabulary' })
  skillName: string;

  @ApiProperty({ description: 'Current skill level (1-5)', example: 3 })
  currentLevel: number;

  @ApiProperty({ description: 'Target skill level (1-5)', example: 5 })
  targetLevel: number;

  @ApiProperty({ description: 'Observation notes' })
  observation: string;

  @ApiProperty({ description: 'Whether a milestone was achieved' })
  milestoneAchieved: boolean;

  @ApiProperty({ description: 'Date when progress was recorded', format: 'date' })
  recordedDate: string;

  @ApiProperty({ description: 'Next steps for continued development', nullable: true })
  nextSteps: string | null;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ description: 'Update timestamp', format: 'date-time' })
  updatedAt: string;
}










