import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, ArrayMinSize, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadTeacherMediaDto {
  @ApiProperty({ 
    description: 'Array of student/child IDs to tag in the media (JSON string from FormData)', 
    type: String,
    example: '["123e4567-e89b-12d3-a456-426614174000"]'
  })
  @Transform(({ value }) => {
    // Handle JSON string from FormData
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  studentIds: string[];

  @ApiPropertyOptional({ 
    description: 'Caption/description for the media post',
    example: 'Fun day at the playground!'
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ 
    description: 'Whether the post is private (only tagged parents can see)',
    default: false
  })
  @Transform(({ value }) => {
    // Handle string from FormData
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value === true;
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

