import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { AppRole } from '../../../common/enums/app-role.enum';

const ROLE_ENUM_VALUES = Object.values(AppRole);

export class SendWelcomeEmailDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  userEmail: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString()
  userName: string;

  @ApiProperty({
    description: 'User role',
    enum: ROLE_ENUM_VALUES,
    example: AppRole.PARENT,
  })
  @IsEnum(AppRole)
  userRole: AppRole;

  @ApiProperty({
    description: 'School name',
    example: 'Little Stars Preschool',
    required: false,
  })
  @IsString()
  @IsOptional()
  schoolName?: string;

  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsString()
  @IsOptional()
  schoolId?: string;
}


