import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeadDocumentResponseDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'Student/Lead ID' })
  student_id: string;

  @ApiProperty({ description: 'School ID' })
  school_id: string;

  @ApiProperty({ description: 'Document type', example: 'Birth Certificate' })
  document_type: string;

  @ApiProperty({ description: 'File name' })
  file_name: string;

  @ApiProperty({ description: 'File path in storage' })
  file_path: string;

  @ApiPropertyOptional({ description: 'File URL' })
  file_url?: string | null;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at: string;

  @ApiPropertyOptional({ description: 'Parent submitted at timestamp' })
  parent_submitted_at?: string | null;
}


