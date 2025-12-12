import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ConvertLeadDto {
  @ApiPropertyOptional({
    description: 'Program name (defaults to lead program if not provided)',
    example: 'Full Day Preschool',
  })
  @IsString()
  @IsOptional()
  program?: string;
}


