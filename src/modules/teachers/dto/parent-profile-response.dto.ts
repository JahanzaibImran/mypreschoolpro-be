import { ApiProperty } from '@nestjs/swagger';

export class ParentProfileResponseDto {
  @ApiProperty({ description: 'Parent profile ID', format: 'uuid' })
  parentId: string;

  @ApiProperty({ description: 'Parent first name' })
  parentFirstName: string;

  @ApiProperty({ description: 'Parent last name' })
  parentLastName: string;

  @ApiProperty({ description: 'Parent email' })
  parentEmail: string;
}


