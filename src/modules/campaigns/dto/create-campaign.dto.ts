import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEnum, IsArray, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { CampaignStatus } from '../../../common/enums/campaign-status.enum';
import { CommunicationChannel } from '../../../common/enums/communication-channel.enum';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign name',
    example: 'Summer Enrollment Campaign 2024',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Campaign description',
    example: 'Promote summer enrollment with special offers',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiPropertyOptional({
    description: 'Campaign status',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @ApiPropertyOptional({
    description: 'Target audience criteria (JSON object)',
    example: { ageGroup: 'toddler', program: 'preschool' },
  })
  @IsOptional()
  targetAudience?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Communication channels',
    enum: CommunicationChannel,
    isArray: true,
    example: [CommunicationChannel.EMAIL, CommunicationChannel.SMS],
  })
  @IsArray()
  @IsEnum(CommunicationChannel, { each: true })
  @IsOptional()
  communicationChannels?: CommunicationChannel[];

  @ApiPropertyOptional({
    description: 'Scheduled date and time (ISO 8601)',
    example: '2024-06-01T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

