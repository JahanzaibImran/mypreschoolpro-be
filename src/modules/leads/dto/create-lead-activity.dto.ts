import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum ContactType {
  EMAIL = 'email',
  PHONE = 'phone',
  NOTE = 'note',
}

export class CreateLeadActivityDto {
  @ApiProperty({
    description: 'Activity type',
    enum: ContactType,
    example: ContactType.EMAIL,
  })
  @IsEnum(ContactType)
  @IsNotEmpty()
  activityType: ContactType;

  @ApiPropertyOptional({
    description: 'Subject of the contact (for email)',
    example: 'Welcome to Our School - Next Steps',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description: 'Content/message of the contact',
    example: 'Thank you for your interest in our school...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}









