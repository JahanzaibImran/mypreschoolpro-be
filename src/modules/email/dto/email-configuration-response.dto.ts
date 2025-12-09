import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailConfigurationResponseDto {
  @ApiProperty({ description: 'Configuration ID' })
  id: string;

  @ApiProperty({ description: 'School ID' })
  schoolId: string;

  @ApiProperty({ description: 'From email address' })
  fromEmail: string;

  @ApiProperty({ description: 'From name' })
  fromName: string;

  @ApiPropertyOptional({ description: 'Reply-to email address' })
  replyToEmail: string | null;

  @ApiProperty({ description: 'SMTP provider' })
  smtpProvider: string;

  @ApiProperty({ description: 'Is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy: string | null;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: string;
}








