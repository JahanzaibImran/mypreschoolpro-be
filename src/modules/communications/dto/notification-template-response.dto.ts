import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Email subject line' })
  subject: string;

  @ApiProperty({ description: 'Email content' })
  content: string;

  @ApiProperty({ description: 'Template type' })
  type: string;

  @ApiProperty({ description: 'Template variables' })
  variables: Record<string, any>;

  @ApiProperty({ description: 'Is active' })
  active: boolean;

  @ApiPropertyOptional({ description: 'Attachment URL' })
  attachmentUrl: string | null;

  @ApiPropertyOptional({ description: 'Attachment name' })
  attachmentName: string | null;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy: string | null;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: string;
}











