import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateEmailConfigurationDto {
  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({
    description: 'From email address',
    example: 'admissions@yourschool.com',
  })
  @IsEmail()
  @IsNotEmpty()
  fromEmail: string;

  @ApiProperty({
    description: 'From name',
    example: 'Your School Name',
  })
  @IsString()
  @IsNotEmpty()
  fromName: string;

  @ApiPropertyOptional({
    description: 'Reply-to email address',
    example: 'contact@yourschool.com',
  })
  @IsEmail()
  @IsOptional()
  replyToEmail?: string | null;

  @ApiPropertyOptional({
    description: 'SMTP provider',
    example: 'resend',
    default: 'resend',
  })
  @IsString()
  @IsOptional()
  smtpProvider?: string;

  @ApiPropertyOptional({
    description: 'Whether this configuration is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

}



