import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppRole } from '../../../common/enums/app-role.enum';

export class UpdateStaffRoleDto {
  @ApiProperty({
    description: 'New role to assign to the staff member',
    enum: AppRole,
    example: AppRole.SCHOOL_ADMIN,
  })
  @IsEnum(AppRole)
  role: AppRole;

  @ApiPropertyOptional({
    description: 'Updated first name for the staff member',
    example: 'Alex',
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({
    description: 'Updated last name for the staff member',
    example: 'Rivera',
  })
  @IsOptional()
  @IsString()
  last_name?: string;
}






