import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  first_name?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  last_name?: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  phone?: string;

  @ApiProperty({ example: '123 Main Street', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'San Francisco', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ example: 'CA', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @ApiProperty({ example: '94102', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip_code?: string;

  @ApiProperty({ example: 'https://bucket.s3.region.amazonaws.com/avatars/user-id/file.jpg', required: false })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiProperty({ example: 'Experienced teacher with 10 years in early childhood education', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'active', required: false, enum: ['active', 'suspended', 'inactive'] })
  @IsOptional()
  @IsString()
  status?: string;
}






