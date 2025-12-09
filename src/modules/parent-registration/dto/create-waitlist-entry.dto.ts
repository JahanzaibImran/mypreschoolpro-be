import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString } from 'class-validator';

export class CreateWaitlistEntryDto {
  @ApiProperty()
  @IsUUID()
  leadId: string;

  @ApiProperty()
  @IsUUID()
  schoolId: string;

  @ApiProperty()
  @IsString()
  program: string;
}






