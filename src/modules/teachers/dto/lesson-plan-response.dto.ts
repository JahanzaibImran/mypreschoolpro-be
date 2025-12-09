import { ApiProperty } from '@nestjs/swagger';
import { LessonPlanStatus } from '../entities/lesson-plan.entity';

export class LessonPlanResponseDto {
  @ApiProperty({ description: 'Lesson plan ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Lesson title' })
  title: string;

  @ApiProperty({ description: 'Subject area' })
  subject: string;

  @ApiProperty({ description: 'Date of the lesson', format: 'date' })
  lessonDate: string;

  @ApiProperty({ description: 'Learning objectives', nullable: true })
  objectives: string | null;

  @ApiProperty({ description: 'Materials needed', type: [String] })
  materials: string[];

  @ApiProperty({ description: 'Activities and procedures', nullable: true })
  activities: string | null;

  @ApiProperty({ description: 'Assessment methods', nullable: true })
  assessment: string | null;

  @ApiProperty({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Lesson status', enum: LessonPlanStatus })
  status: LessonPlanStatus;

  @ApiProperty({ description: 'Lesson duration in minutes' })
  duration: number;

  @ApiProperty({ description: 'Target age group', nullable: true })
  ageGroup: string | null;

  @ApiProperty({ description: 'Class ID', format: 'uuid' })
  classId: string;

  @ApiProperty({ description: 'School ID', format: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: 'Teacher ID', format: 'uuid' })
  teacherId: string;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ description: 'Update timestamp', format: 'date-time' })
  updatedAt: string;
}










