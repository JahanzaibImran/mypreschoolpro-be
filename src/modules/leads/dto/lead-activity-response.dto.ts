import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeadActivityResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the activity record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Lead ID associated with the activity',
    example: '223e4567-e89b-12d3-a456-426614174000',
  })
  leadId: string;

  @ApiPropertyOptional({
    description: 'User ID of the staff member who triggered the activity',
    example: '323e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  userId: string | null;

  @ApiProperty({
    description: 'Activity type',
    example: 'email_sent',
  })
  activityType: string;

  @ApiPropertyOptional({
    description: 'Notes captured for the activity',
    example: '[Tour Follow-up] Sent reminder email',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Timestamp when the activity was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiPropertyOptional({
    description: 'Lead child name',
    example: 'Emma Doe',
    nullable: true,
  })
  leadName: string | null;

  @ApiPropertyOptional({
    description: 'Parent/guardian name',
    example: 'John Doe',
    nullable: true,
  })
  parentName: string | null;

  @ApiPropertyOptional({
    description: 'Parent/guardian email',
    example: 'parent@example.com',
    nullable: true,
  })
  parentEmail: string | null;
}




