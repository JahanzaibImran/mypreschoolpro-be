import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class FindSchoolsByLocationDto {
  @ApiProperty({ example: '94110' })
  @IsString()
  @Matches(/^\d{5}(-\d{4})?$/, { message: 'zipCode must be a valid US zip code' })
  zipCode: string;

  @ApiProperty({ example: 25, required: false, description: 'Radius in miles (default 25)' })
  @IsOptional()
  @IsNumber()
  radiusMiles?: number;
}






