import { ApiProperty } from '@nestjs/swagger';

export class AssignableStaffResponseDto {
  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'First name' })
  first_name: string | null;

  @ApiProperty({ description: 'Last name' })
  last_name: string | null;

  @ApiProperty({ description: 'Email' })
  email: string | null;

  @ApiProperty({ description: 'Role' })
  role: string;
}


