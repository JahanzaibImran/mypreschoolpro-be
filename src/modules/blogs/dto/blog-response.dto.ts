import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlogStatus } from '../entities/blog.entity';

export class BlogResponseDto {
  @ApiProperty({
    description: 'Blog post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Blog post title',
    example: 'Getting Started with Early Childhood Education',
  })
  title: string;

  @ApiProperty({
    description: 'Full blog content',
    example: 'This is the full content of the blog post...',
  })
  content: string;

  @ApiPropertyOptional({
    description: 'Short excerpt/summary',
    example: 'A brief introduction to early childhood education...',
  })
  excerpt?: string | null;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'getting-started-with-early-childhood-education',
  })
  slug: string;

  @ApiProperty({
    description: 'Blog status',
    enum: BlogStatus,
    example: BlogStatus.PUBLISHED,
  })
  status: BlogStatus;

  @ApiPropertyOptional({
    description: 'Author user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  authorId?: string | null;

  @ApiPropertyOptional({
    description: 'URL for featured image',
    example: 'https://example.com/image.jpg',
  })
  featuredImageUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Publication date and time',
    example: '2024-01-15T10:30:00Z',
  })
  publishedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Scheduled publication date and time',
    example: '2024-12-25T09:00:00Z',
  })
  scheduledAt?: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}















