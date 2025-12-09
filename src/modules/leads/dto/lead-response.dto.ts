import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus, LeadSource } from '../entities/lead.entity';

export class LeadResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the lead',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  // Parent/Guardian Information
  @ApiPropertyOptional({
    description: 'Parent/Guardian first name',
    example: 'John',
    nullable: true,
  })
  parentFirstName: string | null;

  @ApiPropertyOptional({
    description: 'Parent/Guardian last name',
    example: 'Doe',
    nullable: true,
  })
  parentLastName: string | null;

  @ApiPropertyOptional({
    description: 'Parent/Guardian email address',
    example: 'john.doe@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiPropertyOptional({
    description: 'Parent/Guardian phone number',
    example: '+1-555-123-4567',
    nullable: true,
  })
  phone: string | null;

  @ApiPropertyOptional({
    description: 'Full parent name',
    example: 'John Doe',
    nullable: true,
  })
  parentName: string | null;

  @ApiPropertyOptional({
    description: 'Alternate phone number',
    example: '+1-555-123-4568',
    nullable: true,
  })
  alternatePhone: string | null;

  // Child Information
  @ApiPropertyOptional({
    description: 'Child first name',
    example: 'Emma',
    nullable: true,
  })
  childFirstName: string | null;

  @ApiPropertyOptional({
    description: 'Child last name',
    example: 'Doe',
    nullable: true,
  })
  childLastName: string | null;

  @ApiPropertyOptional({
    description: 'Full child name',
    example: 'Emma Doe',
    nullable: true,
  })
  childName: string | null;

  @ApiPropertyOptional({
    description: 'Child date of birth',
    example: '2020-05-15',
    nullable: true,
  })
  childDateOfBirth: Date | null;

  @ApiPropertyOptional({
    description: 'Child age group',
    example: '3-4',
    nullable: true,
  })
  childAgeGroup: string | null;

  // School and Program Information
  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  schoolId: string;

  @ApiPropertyOptional({
    description: 'Program of interest',
    example: 'Full Day Preschool',
    nullable: true,
  })
  programInterest: string | null;

  @ApiPropertyOptional({
    description: 'Preferred start date',
    example: '2024-09-01',
    nullable: true,
  })
  preferredStartDate: Date | null;

  // Lead Management
  @ApiProperty({
    description: 'Lead status',
    enum: LeadStatus,
    example: LeadStatus.NEW,
  })
  status: LeadStatus;

  @ApiPropertyOptional({
    description: 'Lead source',
    enum: LeadSource,
    nullable: true,
  })
  source: LeadSource | null;

  @ApiPropertyOptional({
    description: 'Public notes',
    example: 'Interested in full-day program. Prefers morning schedule.',
    nullable: true,
  })
  notes: string | null;

  @ApiPropertyOptional({
    description: 'Internal notes (not visible to parents)',
    example: 'Follow up in 2 weeks. Mention summer camp programs.',
    nullable: true,
  })
  internalNotes: string | null;

  @ApiPropertyOptional({
    description: 'Follow-up date',
    example: '2024-01-20',
    nullable: true,
  })
  followUpDate: Date | null;

  @ApiPropertyOptional({
    description: 'Next follow-up date/time',
    example: '2024-01-25T10:00:00Z',
    nullable: true,
  })
  nextFollowUpAt: Date | null;

  @ApiPropertyOptional({
    description: 'User ID of staff member assigned to this lead',
    example: '123e4567-e89b-12d3-a456-426614174002',
    nullable: true,
  })
  assignedTo: string | null;

  @ApiPropertyOptional({
    description: 'Lead score used for prioritization',
    example: 85,
    nullable: true,
  })
  leadScore: number | null;

  @ApiPropertyOptional({
    description: 'Priority score used for ranking',
    example: 120,
    nullable: true,
  })
  priorityScore: number | null;

  @ApiPropertyOptional({
    description: 'Lead urgency label',
    example: 'high',
    nullable: true,
  })
  urgency: string | null;

  // @ApiPropertyOptional({
  //   description: 'User ID who created the lead',
  //   example: '123e4567-e89b-12d3-a456-426614174003',
  //   nullable: true,
  // })
  // createdBy: string | null;

  // Conversion Tracking
  @ApiPropertyOptional({
    description: 'Enrollment ID if lead was converted',
    example: '123e4567-e89b-12d3-a456-426614174004',
    nullable: true,
  })
  convertedToEnrollmentId: string | null;

  @ApiPropertyOptional({
    description: 'Date when lead was converted to enrollment',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  convertedAt: Date | null;

  // Additional Metadata
  @ApiPropertyOptional({
    description: 'Additional metadata (JSON object)',
    example: { campaignId: 'camp_123', utmSource: 'google' },
    nullable: true,
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Timestamp when the lead was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the lead was last updated',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}




