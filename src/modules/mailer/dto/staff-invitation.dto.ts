import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum } from 'class-validator';
import { AppRole } from '../../../common/enums/app-role.enum';

const ROLE_ENUM_VALUES = Object.values(AppRole);

export class SendStaffInvitationDto {
  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  schoolId: string;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'teacher@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Staff role',
    enum: ROLE_ENUM_VALUES,
    example: AppRole.TEACHER,
  })
  @IsEnum(AppRole)
  role: AppRole;

  @ApiProperty({
    description: 'School name',
    example: 'Little Stars Preschool',
  })
  @IsString()
  schoolName: string;

  @ApiProperty({
    description: 'Name of person sending invitation',
    example: 'Jane Smith',
  })
  @IsString()
  invitedBy: string;

  @ApiProperty({
    description: 'Invitation token',
    example: 'inv_abc123xyz789',
  })
  @IsString()
  invitationToken: string;

  @ApiProperty({
    description: 'Full invitation link URL',
    example: 'https://app.mypreschoolpro.com/invite/accept?token=inv_abc123xyz789',
  })
  @IsString()
  invitationLink: string;
}


