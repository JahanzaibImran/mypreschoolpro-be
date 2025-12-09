import { ApiProperty } from '@nestjs/swagger';
import { ProgressStatus } from '../entities/student-progress.entity';

export class ProgressResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  studentId: string;

  @ApiProperty({ example: 'Mathematics' })
  subject: string;

  @ApiProperty({ example: 85 })
  progressPercentage: number;

  @ApiProperty({ example: 'A', nullable: true })
  grade: string | null;

  @ApiProperty({ example: 'Showing great improvement', nullable: true })
  teacherComments: string | null;

  @ApiProperty({ enum: ProgressStatus })
  status: ProgressStatus;

  @ApiProperty({ example: '2024-01-15' })
  assessmentDate: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  updatedAt: string;
}








