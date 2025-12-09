import { ApiProperty } from '@nestjs/swagger';
import { AppRole } from '../../../common/enums/app-role.enum';

const ROLE_ENUM_VALUES = Object.values(AppRole);

export class UserRoleDto {
  @ApiProperty({
    description: 'Unique identifier for the user role',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Role type',
    enum: ROLE_ENUM_VALUES,
    example: AppRole.TEACHER,
  })
  role: AppRole;

  @ApiProperty({
    description: 'School ID associated with this role (null for super_admin)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  schoolId: string | null;

  @ApiProperty({
    description: 'Timestamp when the role was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Account status',
    enum: ['active', 'inactive', 'pending'],
    example: 'active',
  })
  status: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Array of roles assigned to the user',
    type: [UserRoleDto],
  })
  roles: UserRoleDto[];

  @ApiProperty({
    description: 'Primary role (highest priority role)',
    enum: ROLE_ENUM_VALUES,
    example: AppRole.TEACHER,
  })
  primaryRole: AppRole;

  @ApiProperty({
    description: 'Primary school ID (from highest priority role)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  schoolId: string | null;

  @ApiProperty({
    description: 'User profile information',
    type: UserProfileDto,
    required: false,
    nullable: true,
  })
  profile?: UserProfileDto;
}