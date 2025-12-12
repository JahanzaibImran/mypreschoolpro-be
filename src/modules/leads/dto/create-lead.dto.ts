import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsObject,
  MaxLength,
  IsDate,
} from 'class-validator';
import { LeadStatus, LeadSource } from '../entities/lead.entity';

export class CreateLeadDto {
  // Parent/Guardian Information
  @ApiPropertyOptional({
    description: 'Parent/Guardian first name',
    example: 'John',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  parentFirstName?: string;

  @ApiPropertyOptional({
    description: 'Parent/Guardian last name',
    example: 'Doe',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  parentLastName?: string;

  @ApiPropertyOptional({
    description: 'Parent/Guardian email address',
    example: 'john.doe@example.com',
    maxLength: 255,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Parent/Guardian phone number',
    example: '+1-555-123-4567',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Alternate phone number',
    example: '+1-555-123-4568',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  alternatePhone?: string;

  // Child Information
  @ApiPropertyOptional({
    description: 'Child first name',
    example: 'Emma',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  childFirstName?: string;

  @ApiPropertyOptional({
    description: 'Child last name',
    example: 'Doe',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  childLastName?: string;

  @ApiPropertyOptional({
    description: 'Child date of birth',
    example: '2020-05-15',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  childDateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Child age group',
    example: '3-4',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  childAgeGroup?: string;

  // School and Program Information
  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  schoolId: string;

  @ApiPropertyOptional({
    description: 'Program of interest',
    example: 'Full Day Preschool',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  programInterest?: string;

  @ApiPropertyOptional({
    description: 'Preferred start date',
    example: '2024-09-01',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  preferredStartDate?: string;

  // Lead Management
  @ApiPropertyOptional({
    description: 'Lead status',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({
    description: 'Lead source',
    enum: LeadSource,
  })
  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource;

  @ApiPropertyOptional({
    description: 'Public notes',
    example: 'Interested in full-day program. Prefers morning schedule.',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Internal notes (not visible to parents)',
    example: 'Follow up in 2 weeks. Mention summer camp programs.',
  })
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiPropertyOptional({
    description: 'Follow-up date',
    example: '2024-01-20',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @ApiPropertyOptional({
    description: 'Tour date',
    example: '2024-01-25T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  tourDate?: string;

  @ApiPropertyOptional({
    description: 'User ID of staff member assigned to this lead',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  // Additional Metadata
  @ApiPropertyOptional({
    description: 'Additional metadata (JSON object)',
    example: { campaignId: 'camp_123', utmSource: 'google' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}




