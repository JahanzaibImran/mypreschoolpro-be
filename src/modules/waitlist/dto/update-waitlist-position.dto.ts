import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateWaitlistPositionDto {
  @ApiProperty({
    description: 'New waitlist position (1 = top of the list)',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  position: number;
}






