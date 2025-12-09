import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '../../../common/enums/campaign-status.enum';
import { CommunicationChannel } from '../../../common/enums/communication-channel.enum';

export class CampaignResponseDto {
  @ApiProperty({
    description: 'Campaign ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Campaign name',
    example: 'Summer Enrollment Campaign 2024',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Campaign description',
    example: 'Promote summer enrollment with special offers',
  })
  description: string | null;

  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  schoolId: string;

  @ApiProperty({
    description: 'School name',
    example: 'ABC Preschool',
  })
  schoolName?: string;

  @ApiProperty({
    description: 'Created by user ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Campaign status',
    enum: CampaignStatus,
    example: CampaignStatus.ACTIVE,
  })
  status: CampaignStatus;

  @ApiPropertyOptional({
    description: 'Target audience criteria',
    example: { ageGroup: 'toddler', program: 'preschool' },
  })
  targetAudience: Record<string, any>;

  @ApiProperty({
    description: 'Communication channels',
    enum: CommunicationChannel,
    isArray: true,
    example: [CommunicationChannel.EMAIL, CommunicationChannel.SMS],
  })
  communicationChannels: CommunicationChannel[];

  @ApiPropertyOptional({
    description: 'Scheduled date and time',
    example: '2024-06-01T10:00:00Z',
  })
  scheduledAt: string | null;

  @ApiPropertyOptional({
    description: 'Sent date and time',
    example: '2024-06-01T10:05:00Z',
  })
  sentAt: string | null;

  @ApiPropertyOptional({
    description: 'Completed date and time',
    example: '2024-06-01T12:00:00Z',
  })
  completedAt: string | null;

  @ApiProperty({
    description: 'Number of messages sent',
    example: 150,
    default: 0,
  })
  sentCount: number;

  @ApiProperty({
    description: 'Number of messages delivered',
    example: 145,
    default: 0,
  })
  deliveredCount: number;

  @ApiProperty({
    description: 'Number of messages opened',
    example: 120,
    default: 0,
  })
  openCount: number;

  @ApiProperty({
    description: 'Number of clicks',
    example: 80,
    default: 0,
  })
  clickCount: number;

  @ApiProperty({
    description: 'Number of failed messages',
    example: 5,
    default: 0,
  })
  failedCount: number;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-05-01T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-05-01T10:00:00Z',
  })
  updatedAt: string;
}

