import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum InteractionType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  NOTE = 'note',
}

export class CreateLeadInteractionDto {
  @ApiProperty({
    description: 'Type of interaction',
    enum: InteractionType,
    example: InteractionType.NOTE,
  })
  @IsEnum(InteractionType)
  @IsNotEmpty()
  interaction_type: InteractionType;

  @ApiPropertyOptional({
    description: 'Subject of the interaction',
    example: 'Follow-up call',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description: 'Content/details of the interaction',
    example: 'Discussed enrollment options and answered questions about the program.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}


