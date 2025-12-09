import { ApiProperty } from '@nestjs/swagger';
import { DailyReportStatus } from '../entities/daily-report.entity';

export class DailyReportResponseDto {
  @ApiProperty({ description: 'Unique ID of the report', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'ID of the teacher who created the report', format: 'uuid' })
  teacherId: string;

  @ApiProperty({ description: 'ID of the school', format: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: 'ID of the student (legacy field, nullable)', format: 'uuid', nullable: true })
  studentId: string | null;

  @ApiProperty({ description: 'Date of the report', example: '2025-11-23', format: 'date' })
  reportDate: string;

  @ApiProperty({ description: 'Array of student names', type: [String], example: ['John Doe', 'Jane Smith'] })
  studentNames: string[];

  @ApiProperty({ description: 'Activities and learning description', nullable: true })
  activities: string | null;

  @ApiProperty({ description: 'Meals and snacks description', nullable: true })
  meals: string | null;

  @ApiProperty({ description: 'Nap time information', nullable: true })
  napTime: string | null;

  @ApiProperty({ description: 'Mood and behavior notes', nullable: true })
  moodBehavior: string | null;

  @ApiProperty({ description: 'Milestones and achievements', nullable: true })
  milestones: string | null;

  @ApiProperty({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Status of the report', enum: DailyReportStatus })
  status: DailyReportStatus;

  @ApiProperty({ description: 'Timestamp when the report was created', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ description: 'Timestamp when the report was last updated', format: 'date-time' })
  updatedAt: string;
}









