import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'School ID' })
  schoolId: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Email subject line' })
  subject: string;

  @ApiProperty({ description: 'HTML content' })
  htmlContent: string;

  @ApiProperty({ description: 'Template category' })
  category: string;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Template variables' })
  templateVariables: any[];

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy: string | null;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: string;
}








