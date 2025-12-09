import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog, BlogStatus } from './entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  private readonly logger = new Logger(BlogsService.name);

  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  /**
   * Generate a URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Ensure slug is unique by appending a number if needed
   */
  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.blogRepository.findOne({
        where: { slug },
      });

      // If no existing blog with this slug, or it's the same blog we're updating
      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      // Slug exists, try with a number suffix
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Create a new blog post
   */
  async create(createBlogDto: CreateBlogDto, authorId?: string): Promise<Blog> {
    this.logger.log(`Creating blog: ${createBlogDto.title}`);

    // Generate slug if not provided
    let slug = createBlogDto.slug;
    if (!slug) {
      slug = this.generateSlug(createBlogDto.title);
    }

    // Ensure slug is unique
    slug = await this.ensureUniqueSlug(slug);

    // Set published_at if status is published
    let publishedAt: Date | null = null;
    if (createBlogDto.status === BlogStatus.PUBLISHED) {
      publishedAt = new Date();
    }

    const blog = this.blogRepository.create({
      ...createBlogDto,
      slug,
      authorId: authorId || createBlogDto.authorId || null,
      publishedAt,
      scheduledAt: createBlogDto.scheduledAt
        ? new Date(createBlogDto.scheduledAt)
        : null,
    });

    return this.blogRepository.save(blog);
  }

  /**
   * Find all blogs with optional filtering
   */
  async findAll(options?: {
    status?: BlogStatus;
    authorId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'publishedAt' | 'updatedAt';
    order?: 'ASC' | 'DESC';
  }): Promise<{ data: Blog[]; total: number }> {
    const {
      status,
      authorId,
      limit = 100,
      offset = 0,
      orderBy = 'createdAt',
      order = 'DESC',
    } = options || {};

    const queryBuilder = this.blogRepository.createQueryBuilder('blog');

    if (status) {
      queryBuilder.where('blog.status = :status', { status });
    }

    if (authorId) {
      queryBuilder.andWhere('blog.authorId = :authorId', { authorId });
    }

    queryBuilder
      .orderBy(`blog.${orderBy}`, order)
      .skip(offset)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Find published blogs (public endpoint)
   */
  async findPublished(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: Blog[]; total: number }> {
    return this.findAll({
      status: BlogStatus.PUBLISHED,
      orderBy: 'publishedAt',
      order: 'DESC',
      ...options,
    });
  }

  /**
   * Find a blog by ID
   */
  async findOne(id: string): Promise<Blog> {
    const blog = await this.blogRepository.findOne({ where: { id } });

    if (!blog) {
      throw new NotFoundException(`Blog with ID "${id}" not found`);
    }

    return blog;
  }

  /**
   * Find a blog by slug (public endpoint)
   */
  async findBySlug(slug: string, publishedOnly: boolean = true): Promise<Blog> {
    const where: any = { slug };

    if (publishedOnly) {
      where.status = BlogStatus.PUBLISHED;
    }

    const blog = await this.blogRepository.findOne({ where });

    if (!blog) {
      throw new NotFoundException(`Blog with slug "${slug}" not found`);
    }

    return blog;
  }

  /**
   * Find related blogs (exclude current blog)
   */
  async findRelated(
    blogId: string,
    limit: number = 3,
  ): Promise<Blog[]> {
    const currentBlog = await this.findOne(blogId);

    const related = await this.blogRepository
      .createQueryBuilder('blog')
      .where('blog.status = :status', { status: BlogStatus.PUBLISHED })
      .andWhere('blog.id != :id', { id: blogId })
      .orderBy('blog.publishedAt', 'DESC')
      .limit(limit)
      .getMany();

    return related;
  }

  /**
   * Update a blog post
   */
  async update(id: string, updateBlogDto: UpdateBlogDto): Promise<Blog> {
    const blog = await this.findOne(id);

    // Generate slug if title changed and slug not provided
    if (updateBlogDto.title && !updateBlogDto.slug) {
      const newSlug = this.generateSlug(updateBlogDto.title);
      updateBlogDto.slug = await this.ensureUniqueSlug(newSlug, id);
    } else if (updateBlogDto.slug) {
      // Ensure new slug is unique
      updateBlogDto.slug = await this.ensureUniqueSlug(updateBlogDto.slug, id);
    }

    // Handle status changes - set publishedAt when status changes to published
    if (updateBlogDto.status === BlogStatus.PUBLISHED && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }

    // Handle scheduled_at
    if (updateBlogDto.scheduledAt) {
      blog.scheduledAt = new Date(updateBlogDto.scheduledAt);
    }

    // Update blog with DTO fields (excluding publishedAt which we handle separately)
    const { scheduledAt, ...dtoFields } = updateBlogDto;
    Object.assign(blog, dtoFields);
    
    return this.blogRepository.save(blog);
  }

  /**
   * Delete a blog post
   */
  async remove(id: string): Promise<void> {
    const blog = await this.findOne(id);
    await this.blogRepository.remove(blog);
  }

  /**
   * Publish scheduled blogs that are ready
   */
  async publishScheduledBlogs(): Promise<{ publishedCount: number; publishedBlogs: Blog[] }> {
    const now = new Date();
    
    // Find all scheduled blogs where scheduledAt <= now
    const readyToPublish = await this.blogRepository
      .createQueryBuilder('blog')
      .where('blog.status = :status', { status: BlogStatus.SCHEDULED })
      .andWhere('blog.scheduledAt <= :now', { now })
      .andWhere('blog.scheduledAt IS NOT NULL')
      .getMany();

    if (readyToPublish.length === 0) {
      return { publishedCount: 0, publishedBlogs: [] };
    }

    // Update all ready blogs to published
    const publishedBlogs = await Promise.all(
      readyToPublish.map(async (blog) => {
        blog.status = BlogStatus.PUBLISHED;
        blog.publishedAt = new Date();
        blog.scheduledAt = null;
        return this.blogRepository.save(blog);
      }),
    );

    this.logger.log(`Published ${publishedBlogs.length} scheduled blogs`);

    return {
      publishedCount: publishedBlogs.length,
      publishedBlogs,
    };
  }
}

