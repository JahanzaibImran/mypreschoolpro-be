import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John', nullable: true })
  first_name: string | null;

  @ApiProperty({ example: 'Doe', nullable: true })
  last_name: string | null;

  @ApiProperty({ example: '+1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ example: '123 Main Street', nullable: true })
  address: string | null;

  @ApiProperty({ example: 'San Francisco', nullable: true })
  city: string | null;

  @ApiProperty({ example: 'CA', nullable: true })
  state: string | null;

  @ApiProperty({ example: '94102', nullable: true })
  zip_code: string | null;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', nullable: true })
  avatar_url?: string | null;

  @ApiProperty({ example: 'Experienced teacher with 10 years in early childhood education', nullable: true })
  bio?: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updated_at: Date;
}

