import { ApiProperty } from '@nestjs/swagger';

export class TeacherClassDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Pre-K Morning Class' })
  name: string;
}

export class TeacherStudentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  lead_id: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'Pre-K' })
  program: string;

  @ApiProperty({ example: 85, nullable: true })
  attendance_rate: number | null;

  @ApiProperty({ example: 75, nullable: true })
  progress_percentage: number | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  class_id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  school_id: string;

  @ApiProperty({
    type: 'object',
    properties: {
      child_name: { type: 'string', example: 'John Doe' },
      parent_name: { type: 'string', example: 'Jane Doe' },
      parent_email: { type: 'string', example: 'jane@example.com' },
      child_birthdate: { type: 'string', example: '2020-01-15' },
    },
  })
  leads: {
    child_name: string;
    parent_name: string;
    parent_email: string;
    child_birthdate: string | null;
  };
}

export class TeacherLessonPlanDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Introduction to Numbers' })
  title: string;

  @ApiProperty({ example: 'Math' })
  subject: string;

  @ApiProperty({ example: '2024-01-15' })
  lesson_date: string;

  @ApiProperty({ example: 'planned', enum: ['planned', 'in_progress', 'completed'] })
  status: string;

  @ApiProperty({ example: 'Students will learn to count from 1 to 10', nullable: true })
  objectives: string | null;
}

export class TeacherDashboardResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  school_id: string;

  @ApiProperty({ type: [TeacherClassDto] })
  classes: TeacherClassDto[];

  @ApiProperty({ type: [TeacherStudentDto] })
  students: TeacherStudentDto[];

  @ApiProperty({ type: [TeacherLessonPlanDto] })
  lesson_plans: TeacherLessonPlanDto[];
}

