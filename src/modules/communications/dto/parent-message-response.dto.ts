import { ApiProperty } from '@nestjs/swagger';
import { ParentMessageType } from '../entities/parent-message.entity';

export class ParentMessageResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  teacherId: string;

  @ApiProperty({ example: 'Jane Doe' })
  teacherName: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  parentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  studentId: string | null;

  @ApiProperty({ example: 'Update on John\'s progress', nullable: true })
  subject: string | null;

  @ApiProperty({ example: 'I wanted to let you know that John has been doing great...' })
  message: string;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: true })
  sentByTeacher: boolean;

  @ApiProperty({ enum: ParentMessageType, example: ParentMessageType.GENERAL })
  messageType: ParentMessageType;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', nullable: true })
  readAt: string | null;
}

