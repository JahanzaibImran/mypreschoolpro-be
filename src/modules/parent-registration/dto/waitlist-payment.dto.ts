import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class WaitlistPaymentSessionDto {
  @ApiProperty({ description: 'Lead ID associated with the payment' })
  @IsUUID()
  leadId: string;

  @ApiProperty({ description: 'School ID for the payment' })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ description: 'Amount in cents', example: 10000 })
  @IsInt()
  @Min(50)
  amount: number;

  @ApiProperty({ default: 'usd' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Payment description', example: 'Priority Waitlist Fee' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Payment type identifier', example: 'waitlist_fee' })
  @IsString()
  paymentType: string;
}

export class WaitlistPaymentResponseDto {
  @ApiProperty()
  url: string;
}










