import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '../entities/student-attendance.entity';

export class UpsertAttendanceDto {
  @ApiProperty({
    description: 'Student ID (actually lead_id from enrollment)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  studentId: string;

  @ApiProperty({
    description: 'Attendance date',
    example: '2024-01-15',
    type: String,
    format: 'date',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({
    description: 'Optional notes about attendance',
    example: 'Arrived 10 minutes late',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}








