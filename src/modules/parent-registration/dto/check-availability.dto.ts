import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString } from 'class-validator';

export class CheckAvailabilityQueryDto {
  @ApiProperty({ description: 'Program name to check availability for' })
  @IsString()
  program: string;
}

export class AvailabilityResponseDto {
  @ApiProperty()
  programCapacity: number;

  @ApiProperty()
  enrolledCount: number;

  @ApiProperty()
  waitlistCount: number;

  @ApiProperty()
  availableSeats: number;

  @ApiProperty()
  hasAvailability: boolean;
}











