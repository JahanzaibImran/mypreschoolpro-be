import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID } from 'class-validator';

export class UpdateStaffStatusDto {
  @ApiProperty({
    description: 'Role assignment ID for the staff member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  roleId: string;

  @ApiProperty({
    description: 'New status for the staff member',
    enum: ['active', 'inactive'],
    example: 'inactive',
  })
  @IsString()
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}






