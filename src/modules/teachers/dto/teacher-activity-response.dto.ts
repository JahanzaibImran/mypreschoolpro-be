import { ApiProperty } from '@nestjs/swagger';
import { ActivityStatus } from '../entities/teacher-activity.entity';

export class ActivityFileDto {
  @ApiProperty({ description: 'Media file ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'File URL' })
  url: string;

  @ApiProperty({ description: 'File type', example: 'image' })
  type: 'image' | 'video' | 'document';

  @ApiProperty({ description: 'File name' })
  fileName: string;
}

export class ActivityTaggedStudentDto {
  @ApiProperty({ description: 'Student enrollment ID', format: 'uuid' })
  enrollmentId: string;

  @ApiProperty({ description: 'Student name' })
  studentName: string;
}

export class TeacherActivityResponseDto {
  @ApiProperty({ description: 'Activity ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Activity title' })
  title: string;

  @ApiProperty({ description: 'Activity description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Activity type', example: 'Art & Crafts' })
  activityType: string;

  @ApiProperty({ description: 'Skill areas addressed', type: [String] })
  skillAreas: string[];

  @ApiProperty({ description: 'Learning objectives', nullable: true })
  learningObjectives: string | null;

  @ApiProperty({ description: 'Materials used', type: [String] })
  materialsUsed: string[];

  @ApiProperty({ description: 'Teacher reflection', nullable: true })
  reflection: string | null;

  @ApiProperty({ description: 'Date when activity was completed', format: 'date' })
  dateCompleted: string;

  @ApiProperty({ description: 'Activity duration in minutes' })
  duration: number;

  @ApiProperty({ description: 'Activity status', enum: ActivityStatus })
  status: ActivityStatus;

  @ApiProperty({ description: 'Tagged students', type: [ActivityTaggedStudentDto] })
  taggedStudents: ActivityTaggedStudentDto[];

  @ApiProperty({ description: 'Activity files', type: [ActivityFileDto] })
  files: ActivityFileDto[];

  @ApiProperty({ description: 'Teacher ID', format: 'uuid' })
  teacherId: string;

  @ApiProperty({ description: 'School ID', format: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ description: 'Update timestamp', format: 'date-time' })
  updatedAt: string;
}

