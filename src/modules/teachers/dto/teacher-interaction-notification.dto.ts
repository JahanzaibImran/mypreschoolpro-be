import { ApiProperty } from '@nestjs/swagger';

export class TeacherInteractionNotificationDto {
  @ApiProperty({ description: 'Interaction ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Lead/Student ID', format: 'uuid' })
  leadId: string;

  @ApiProperty({ description: 'User ID (teacher who receives notification)', format: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Interaction type', example: 'notification' })
  interactionType: string;

  @ApiProperty({ description: 'Subject of the interaction', nullable: true })
  subject: string | null;

  @ApiProperty({ description: 'Content of the interaction' })
  content: string;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ description: 'Child name', nullable: true })
  childName: string | null;

  @ApiProperty({ description: 'Parent name', nullable: true })
  parentName: string | null;

  @ApiProperty({ description: 'Whether notification is read', default: false })
  isRead: boolean;
}









