import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { BlogStatus } from '../entities/blog.entity';

export class CreateBlogDto {
  @ApiProperty({
    description: 'Blog post title',
    example: 'Getting Started with Early Childhood Education',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiProperty({
    description: 'Full blog content (supports markdown)',
    example: 'This is the full content of the blog post...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Short excerpt/summary of the blog post',
    example: 'A brief introduction to early childhood education...',
  })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'getting-started-with-early-childhood-education',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Blog status',
    enum: BlogStatus,
    default: BlogStatus.DRAFT,
  })
  @IsEnum(BlogStatus)
  @IsOptional()
  status?: BlogStatus;

  @ApiPropertyOptional({
    description: 'Author user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({
    description: 'URL for featured image',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsOptional()
  featuredImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Scheduled publication date and time (ISO string)',
    example: '2024-12-25T09:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

