import { ApiProperty } from '@nestjs/swagger';
import { AppRole } from '../../../common/enums/app-role.enum';

export class StaffInvitationResponseDto {
  @ApiProperty({ description: 'Invitation ID' })
  id: string;

  @ApiProperty({ description: 'School ID' })
  schoolId: string;

  @ApiProperty({ description: 'Invited email address' })
  invitedEmail: string;

  @ApiProperty({ description: 'Role to be assigned', enum: AppRole })
  invitedRole: AppRole;

  @ApiProperty({ description: 'Invitation status', example: 'pending' })
  status: 'pending' | 'expired' | 'accepted';

  @ApiProperty({ description: 'Invitation expiration date ISO string' })
  expiresAt: string;

  @ApiProperty({ description: 'Creation timestamp ISO string' })
  createdAt: string;
}


