import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  welcome_email?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  payment_notifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  system_alerts?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  marketing_emails?: boolean;
}

export class NotificationSettingsResponseDto {
  @ApiProperty()
  welcome_email: boolean;

  @ApiProperty()
  payment_notifications: boolean;

  @ApiProperty()
  system_alerts: boolean;

  @ApiProperty()
  marketing_emails: boolean;
}





