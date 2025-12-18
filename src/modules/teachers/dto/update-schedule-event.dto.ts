import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional, IsBoolean, MaxLength, IsUUID } from 'class-validator';
import { TeacherScheduleEventType } from '../entities/teacher-schedule-event.entity';

export class UpdateScheduleEventDto {
  @ApiPropertyOptional({ description: 'Event title', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Event date', format: 'date' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ description: 'Start time', format: 'time' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time', format: 'time' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Event type', enum: TeacherScheduleEventType })
  @IsOptional()
  @IsEnum(TeacherScheduleEventType)
  eventType?: TeacherScheduleEventType;

  @ApiPropertyOptional({ description: 'Class ID (for class schedule events)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Location/room', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether event is recurring' })
  @IsOptional()
  @IsBoolean()
  recurring?: boolean;
}










