import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ClassStatus } from '../entities/class.entity';

export class UpdateClassStatusDto {
  @ApiProperty({
    description: 'Class status',
    enum: ClassStatus,
    example: ClassStatus.OPEN,
  })
  @IsEnum(ClassStatus)
  status: ClassStatus;
}




