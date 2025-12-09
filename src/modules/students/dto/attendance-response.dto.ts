import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '../entities/student-attendance.entity';

export class AttendanceResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  studentId: string;

  @ApiProperty({ example: '2024-01-15' })
  date: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @ApiProperty({ example: 'Arrived 10 minutes late', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  updatedAt: string;
}








