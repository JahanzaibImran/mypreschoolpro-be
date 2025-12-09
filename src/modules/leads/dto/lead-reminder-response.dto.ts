import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReminderStatusType } from '../../../common/enums/reminder-status-type.enum';

export class LeadReminderResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Follow up call' })
  title: string;

  @ApiPropertyOptional({
    example: 'Call the parent to discuss tour availability',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Reminder type',
    example: 'call',
  })
  reminderType: string;

  @ApiProperty({
    description: 'Scheduled date/time for the reminder',
    example: '2025-01-15T10:30:00Z',
  })
  scheduledFor: string;

  @ApiProperty({
    description: 'Reminder status',
    enum: ReminderStatusType,
    example: ReminderStatusType.PENDING,
  })
  status: ReminderStatusType;

  @ApiProperty({ example: '2025-01-10T09:00:00Z' })
  createdAt: string;

  @ApiPropertyOptional({
    description: 'Child name associated with this reminder',
    example: 'Emma Doe',
    nullable: true,
  })
  leadName: string | null;
}








