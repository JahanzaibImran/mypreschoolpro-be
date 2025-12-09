import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional, IsArray, IsUUID, IsBoolean } from 'class-validator';
import { AppRole } from '../../../common/enums/app-role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: AppRole,
    example: AppRole.TEACHER,
  })
  @IsEnum(AppRole)
  role: AppRole;

  @ApiPropertyOptional({
    description: 'School ID (required for school_admin, admissions_staff, teacher, parent roles)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  schoolId?: string;

  @ApiPropertyOptional({
    description: 'School IDs for school owner (can own multiple schools)',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  schoolIds?: string[];

  @ApiPropertyOptional({
    description: 'Send invitation email to user',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sendInvitation?: boolean;
}










