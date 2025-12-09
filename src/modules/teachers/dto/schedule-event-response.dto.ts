import { ApiProperty } from '@nestjs/swagger';
import { TeacherScheduleEventType } from '../entities/teacher-schedule-event.entity';

export class ScheduleEventResponseDto {
  @ApiProperty({ description: 'Event ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Event title' })
  title: string;

  @ApiProperty({ description: 'Event description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Event date', format: 'date' })
  eventDate: string;

  @ApiProperty({ description: 'Start time', format: 'time', example: '09:00' })
  startTime: string;

  @ApiProperty({ description: 'End time', format: 'time', example: '10:00' })
  endTime: string;

  @ApiProperty({ description: 'Event type', enum: TeacherScheduleEventType })
  eventType: TeacherScheduleEventType;

  @ApiProperty({ description: 'Location/room', nullable: true })
  location: string | null;

  @ApiProperty({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Whether event is recurring' })
  recurring: boolean;

  @ApiProperty({ description: 'Teacher ID', format: 'uuid' })
  teacherId: string;

  @ApiProperty({ description: 'School ID', format: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ description: 'Update timestamp', format: 'date-time' })
  updatedAt: string;
}










