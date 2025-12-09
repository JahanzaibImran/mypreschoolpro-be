import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LeadStatusType } from '../../../common/enums/lead-status-type.enum';

export class UpdateWaitlistStatusDto {
  @ApiProperty({
    enum: LeadStatusType,
    description: 'New status to apply to the associated lead/waitlist entry',
  })
  @IsEnum(LeadStatusType)
  status: LeadStatusType;
}






