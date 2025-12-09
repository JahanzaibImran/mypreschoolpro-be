import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AssignLeadDto {
  @ApiProperty({
    description: 'User ID to assign the lead to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: 'Optional note that explains why the lead was reassigned',
    example: 'Transferred to Sarah for Spanish-speaking families',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

