import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'New plan type',
    example: 'monthly',
    required: false,
  })
  @IsOptional()
  @IsString()
  planType?: string;

  @ApiProperty({
    description: 'New subscription amount in cents',
    example: 70000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}











