import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateEmailTemplateDto {
  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({
    description: 'Template name',
    example: 'Welcome Email',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Welcome to {{school_name}}!',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'HTML content of the email',
    example: '<h1>Welcome {{parent_name}}!</h1><p>Thank you for your interest...</p>',
  })
  @IsString()
  @IsNotEmpty()
  htmlContent: string;

  @ApiPropertyOptional({
    description: 'Template category',
    example: 'welcome',
    default: 'custom',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Template variables (JSON array)',
    example: ['parent_name', 'child_name', 'program', 'school_name'],
  })
  @IsArray()
  @IsOptional()
  templateVariables?: any[];
}








