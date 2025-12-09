import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CreateLeadDto } from './create-lead.dto';

export class CreateParentLeadDto extends CreateLeadDto {
  @ApiProperty({
    description: 'Parent or guardian first name',
    example: 'Jane',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare parentFirstName: string;

  @ApiProperty({
    description: 'Parent or guardian last name',
    example: 'Doe',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare parentLastName: string;

  @ApiProperty({
    description: 'Parent email address',
    example: 'jane.doe@example.com',
    maxLength: 255,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  declare email: string;

  @ApiProperty({
    description: 'Primary phone number',
    example: '+1-555-123-1234',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  declare phone: string;

  @ApiProperty({
    description: 'Child first name',
    example: 'Luca',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare childFirstName: string;

  @ApiProperty({
    description: 'Child last name',
    example: 'Doe',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare childLastName: string;

  @ApiProperty({
    description: 'School ID the family is applying to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  declare schoolId: string;

  @ApiPropertyOptional({
    description: 'If true, place the family on the waitlist',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  joinWaitlist?: boolean;

  @ApiPropertyOptional({
    description: 'How the family heard about the school',
    example: 'Facebook Ad',
  })
  @IsString()
  @IsOptional()
  hearAboutUs?: string;

  @ApiPropertyOptional({
    description: 'Referral code or campaign identifier',
    example: 'FALL-2024',
  })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiPropertyOptional({
    description: 'Any additional context shared by the family',
    example: 'Needs early drop-off on weekdays.',
  })
  @IsString()
  @IsOptional()
  familyNotes?: string;
}

