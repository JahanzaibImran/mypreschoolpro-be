import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { TeacherScheduleEventType } from '../entities/teacher-schedule-event.entity';

export class CreateScheduleEventDto {
  @ApiProperty({ description: 'Event title', example: 'Morning Circle Time', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Event date', example: '2025-11-25', format: 'date' })
  @IsDateString()
  eventDate: string;

  @ApiProperty({ description: 'Start time', example: '09:00', format: 'time' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time', example: '10:00', format: 'time' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ description: 'Event type', enum: TeacherScheduleEventType, example: TeacherScheduleEventType.LESSON })
  @IsEnum(TeacherScheduleEventType)
  eventType: TeacherScheduleEventType;

  @ApiPropertyOptional({ description: 'Location/room', example: 'Classroom A', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether event is recurring', default: false })
  @IsOptional()
  @IsBoolean()
  recurring?: boolean;
}










