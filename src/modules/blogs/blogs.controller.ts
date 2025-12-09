import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { Blog, BlogStatus } from './entities/blog.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new blog post',
    description: 'Create a new blog post. Only admins can create blogs.',
  })
  @ApiResponse({
    status: 201,
    description: 'Blog created successfully',
    type: BlogResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogResponseDto> {
    const blog = await this.blogsService.create(createBlogDto, user.id);
    return this.mapToResponseDto(blog);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all blogs (admin)',
    description: 'Retrieve all blogs for admin management. Only admins can access.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BlogStatus,
    description: 'Filter by blog status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results',
    example: 100,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of results to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'List of blogs retrieved successfully',
    type: [BlogResponseDto],
  })
  async findAll(
    @Query('status') status?: BlogStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: BlogResponseDto[]; total: number }> {
    const result = await this.blogsService.findAll({
      status,
      authorId: user?.id,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    return {
      data: result.data.map((blog) => this.mapToResponseDto(blog)),
      total: result.total,
    };
  }

  @Get('published')
  @Public()
  @ApiOperation({
    summary: 'Get published blogs (public)',
    description: 'Retrieve all published blogs. Public endpoint, no authentication required.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of results to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'List of published blogs retrieved successfully',
    type: [BlogResponseDto],
  })
  async findPublished(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ data: BlogResponseDto[]; total: number }> {
    const result = await this.blogsService.findPublished({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    return {
      data: result.data.map((blog) => this.mapToResponseDto(blog)),
      total: result.total,
    };
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({
    summary: 'Get blog by slug (public)',
    description: 'Retrieve a published blog post by its slug. Public endpoint.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Blog post slug',
    example: 'getting-started-with-early-childhood-education',
  })
  @ApiResponse({
    status: 200,
    description: 'Blog retrieved successfully',
    type: BlogResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  async findBySlug(@Param('slug') slug: string): Promise<BlogResponseDto> {
    const blog = await this.blogsService.findBySlug(slug, true);
    return this.mapToResponseDto(blog);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get blog by ID (admin)',
    description: 'Retrieve a blog post by ID. Only admins can access.',
  })
  @ApiParam({
    name: 'id',
    description: 'Blog post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Blog retrieved successfully',
    type: BlogResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  async findOne(@Param('id') id: string): Promise<BlogResponseDto> {
    const blog = await this.blogsService.findOne(id);
    return this.mapToResponseDto(blog);
  }

  @Get(':id/related')
  @Public()
  @ApiOperation({
    summary: 'Get related blogs (public)',
    description: 'Retrieve related published blog posts. Public endpoint.',
  })
  @ApiParam({
    name: 'id',
    description: 'Blog post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of related posts',
    example: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Related blogs retrieved successfully',
    type: [BlogResponseDto],
  })
  async findRelated(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<BlogResponseDto[]> {
    const related = await this.blogsService.findRelated(
      id,
      limit ? Number(limit) : 3,
    );
    return related.map((blog) => this.mapToResponseDto(blog));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a blog post',
    description: 'Update a blog post. Only admins can update blogs.',
  })
  @ApiParam({
    name: 'id',
    description: 'Blog post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Blog updated successfully',
    type: BlogResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogResponseDto> {
    // Check if user is the author or super admin
    const blog = await this.blogsService.findOne(id);
    if (
      blog.authorId !== user.id &&
      user.primaryRole !== AppRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You can only update your own blog posts',
      );
    }

    const updated = await this.blogsService.update(id, updateBlogDto);
    return this.mapToResponseDto(updated);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a blog post',
    description: 'Delete a blog post. Only admins can delete blogs.',
  })
  @ApiParam({
    name: 'id',
    description: 'Blog post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Blog deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    // Check if user is the author or super admin
    const blog = await this.blogsService.findOne(id);
    if (
      blog.authorId !== user.id &&
      user.primaryRole !== AppRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You can only delete your own blog posts',
      );
    }

    await this.blogsService.remove(id);
  }

  @Post('publish-scheduled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publish scheduled blogs',
    description: 'Publish all scheduled blogs that are ready. Only admins can trigger this.',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled blogs published successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        publishedCount: { type: 'number' },
        publishedBlogs: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async publishScheduled(
    @CurrentUser() user: AuthUser,
  ): Promise<{
    message: string;
    publishedCount: number;
    publishedBlogs: BlogResponseDto[];
  }> {
    const result = await this.blogsService.publishScheduledBlogs();

    return {
      message: `Successfully published ${result.publishedCount} scheduled blogs`,
      publishedCount: result.publishedCount,
      publishedBlogs: result.publishedBlogs.map((blog) =>
        this.mapToResponseDto(blog),
      ),
    };
  }

  /**
   * Map Blog entity to BlogResponseDto
   */
  private mapToResponseDto(blog: Blog): BlogResponseDto {
    return {
      id: blog.id,
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      slug: blog.slug,
      status: blog.status,
      authorId: blog.authorId,
      featuredImageUrl: blog.featuredImageUrl,
      publishedAt: blog.publishedAt,
      scheduledAt: blog.scheduledAt,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };
  }
}


