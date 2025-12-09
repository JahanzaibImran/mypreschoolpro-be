import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty()
  @IsUUID()
  leadId: string;

  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty({ description: 'Document type identifier', example: 'enrollment_packet' })
  @IsString()
  documentType: string;
}






