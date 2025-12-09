import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AppRole } from '../../../common/enums/app-role.enum';

export class CreateStaffInvitationDto {
  @ApiProperty({
    description: 'School ID for the invitation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  schoolId: string;

  @ApiProperty({
    description: 'Email address of the invited staff member',
    example: 'teacher@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Role to assign when they accept the invitation',
    enum: AppRole,
    example: AppRole.TEACHER,
  })
  @IsEnum(AppRole)
  role: AppRole;

  @ApiProperty({
    description: 'School name to display in the invitation',
    example: 'Sunshine Preschool',
    required: false,
  })
  @IsOptional()
  @IsString()
  schoolName?: string;
}






