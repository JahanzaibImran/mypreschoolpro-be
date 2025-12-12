import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeadInteractionResponseDto {
  @ApiProperty({ description: 'Interaction ID' })
  id: string;

  @ApiProperty({ description: 'Lead ID' })
  lead_id: string;

  @ApiProperty({ description: 'User ID who created the interaction' })
  user_id: string;

  @ApiProperty({ description: 'Type of interaction', example: 'call' })
  interaction_type: string;

  @ApiPropertyOptional({ description: 'Subject of the interaction' })
  subject?: string | null;

  @ApiPropertyOptional({ description: 'Content/details of the interaction' })
  content?: string | null;

  @ApiProperty({ description: 'Date of the interaction' })
  interaction_date: string;

  @ApiPropertyOptional({ description: 'User name who created the interaction' })
  user_name?: string | null;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  updated_at: string;
}


