import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateSystemNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'System Maintenance Scheduled',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'System maintenance will occur on Saturday from 2-4 AM EST.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.GENERAL,
  })
  @IsEnum(NotificationType)
  type: NotificationType;
}














