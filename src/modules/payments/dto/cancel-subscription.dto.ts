import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiProperty({
    description: 'Optional reason for cancellation',
    example: 'Switching to a different plan',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}















