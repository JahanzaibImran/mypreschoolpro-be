import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SchoolStatus, SchoolSubscriptionStatus } from '../entities/school.entity';

export class CreateSchoolDto {
  @ApiProperty({
    description: 'School name',
    example: 'Little Stars Preschool',
    maxLength: 255,
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Full address of the school',
    example: '123 Main Street, Springfield, IL 62704',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1-555-123-4567',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'info@littlestars.com',
    maxLength: 255,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Owner user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Maximum capacity of the school',
    example: 120,
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Programs offered by the school',
    example: ['Toddler Program', 'Preschool Program'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  programsOffered?: string[];

  @ApiPropertyOptional({
    description: 'School status',
    enum: SchoolStatus,
    default: SchoolStatus.ACTIVE,
  })
  @IsEnum(SchoolStatus)
  @IsOptional()
  status?: SchoolStatus;

  @ApiPropertyOptional({
    description: 'Subscription status',
    enum: SchoolSubscriptionStatus,
    default: SchoolSubscriptionStatus.ACTIVE,
  })
  @IsEnum(SchoolSubscriptionStatus)
  @IsOptional()
  subscriptionStatus?: SchoolSubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Next payment due date',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  nextPaymentDue?: string;

  @ApiPropertyOptional({
    description: 'Stripe customer ID',
    example: 'cus_123456789',
  })
  @IsString()
  @IsOptional()
  stripeCustomerId?: string;

  @ApiPropertyOptional({
    description: 'Stripe subscription ID',
    example: 'sub_123456789',
  })
  @IsString()
  @IsOptional()
  stripeSubscriptionId?: string;

  @ApiPropertyOptional({
    description: 'Subscription amount (in cents)',
    example: 70000,
    default: 70000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  subscriptionAmount?: number;

  @ApiPropertyOptional({
    description: 'Paid in advance period (in days)',
    example: 30,
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  paidInAdvancePeriod?: number;

  @ApiPropertyOptional({
    description: 'Discounted amount (in cents)',
    example: 5000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  discountedAmount?: number;

  @ApiPropertyOptional({
    description: 'Whether access is disabled due to billing issues',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  accessDisabled?: boolean;

  @ApiPropertyOptional({
    description: 'Last payment date',
    example: '2024-01-10T12:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  lastPaymentDate?: string;

  @ApiPropertyOptional({
    description: 'Number of consecutive payment retry attempts',
    example: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  paymentRetryCount?: number;

  @ApiPropertyOptional({
    description: 'Latitude coordinate of the school',
    example: 37.7749,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate of the school',
    example: -122.4194,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;
}