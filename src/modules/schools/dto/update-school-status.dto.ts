import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SchoolStatus } from '../entities/school.entity';

export class UpdateSchoolStatusDto {
  @ApiProperty({
    description: 'School status',
    enum: SchoolStatus,
    example: SchoolStatus.ACTIVE,
  })
  @IsEnum(SchoolStatus)
  status: SchoolStatus;
}




