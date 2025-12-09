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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UpdateSchoolStatusDto } from './dto/update-school-status.dto';
import { SchoolResponseDto } from './dto/school-response.dto';
import { SchoolEntity, SchoolStatus } from './entities/school.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Public } from '../../common/decorators/public.decorator';
import { FindSchoolsByLocationDto } from './dto/find-schools-by-location.dto';

@ApiTags('Schools')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Create a new school',
    description: 'Create a new school. Super admins can create any school. School owners can create schools for themselves.',
  })
  @ApiResponse({
    status: 201,
    description: 'School created successfully',
    type: SchoolResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async create(
    @Body() createSchoolDto: CreateSchoolDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SchoolResponseDto> {
    // Super admins can specify ownerId, others get their own user ID
    const ownerId = user.primaryRole === AppRole.SUPER_ADMIN
      ? createSchoolDto.ownerId || user.id
      : user.id;

    const school = await this.schoolsService.create(createSchoolDto, ownerId);
    return this.mapToResponseDto(school);
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get schools count',
    description: 'Get the total count of schools. Super admins see all schools, others see only their schools.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SchoolStatus,
    description: 'Filter by school status',
  })
  @ApiResponse({
    status: 200,
    description: 'Count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 42 },
      },
    },
  })
  async getCount(
    @Query('status') status?: SchoolStatus,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ count: number }> {
    const isSuperAdmin = user?.primaryRole === AppRole.SUPER_ADMIN;
    const isSchoolOwner = user?.primaryRole === AppRole.SCHOOL_OWNER;

    const ownerFilter = isSuperAdmin
      ? undefined
      : isSchoolOwner
        ? user?.id
        : undefined;

    const schoolFilter =
      !isSuperAdmin && !isSchoolOwner ? user?.schoolId || undefined : undefined;

    const count = await this.schoolsService.getCount({
      status,
      ownerId: ownerFilter,
      schoolId: schoolFilter,
    });

    return { count };
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all schools',
    description: 'Retrieve a list of schools with optional filtering. Public endpoint - returns only active schools when unauthenticated.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SchoolStatus,
    description: 'Filter by school status',
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
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order by created_at',
    example: 'DESC',
  })
  @ApiQuery({
    name: 'ownerId',
    required: false,
    type: String,
    description: 'Filter by school owner ID (super admins only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of schools retrieved successfully',
    type: [SchoolResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('status') status?: SchoolStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('ownerId') ownerId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: SchoolResponseDto[]; total: number }> {
    // If no user is authenticated, only return active schools
    if (!user) {
      const result = await this.schoolsService.findAll({
        status: SchoolStatus.ACTIVE,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        order: order || 'DESC',
      });

      return {
        data: result.data.map((school) => this.mapToResponseDto(school)),
        total: result.total,
      };
    }

    const isSuperAdmin = user?.primaryRole === AppRole.SUPER_ADMIN;
    const isSchoolOwner = user?.primaryRole === AppRole.SCHOOL_OWNER;

    const ownerFilter = isSuperAdmin
      ? ownerId
      : isSchoolOwner
        ? user?.id
        : undefined;

    const schoolFilter =
      !isSuperAdmin && !isSchoolOwner ? user?.schoolId || undefined : undefined;

    const result = await this.schoolsService.findAll({
      status,
      ownerId: ownerFilter,
      schoolId: schoolFilter,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      order: order || 'DESC',
    });

    return {
      data: result.data.map((school) => this.mapToResponseDto(school)),
      total: result.total,
    };
  }

  @Get('by-ids')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get schools by IDs',
    description: 'Retrieve schools by their IDs. Returns only id and name fields. Useful for creating school maps.',
  })
  @ApiQuery({
    name: 'ids',
    required: true,
    type: String,
    description: 'Comma-separated list of school IDs',
    example: '123e4567-e89b-12d3-a456-426614174000,223e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Schools retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
              name: { type: 'string', example: 'ABC Preschool' },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findByIds(@Query('ids') ids: string): Promise<{ success: boolean; data: Array<{ id: string; name: string }> }> {
    const idArray = ids.split(',').map((id) => id.trim()).filter((id) => id.length > 0);
    const schools = await this.schoolsService.findByIds(idArray);
    return {
      success: true,
      data: schools,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a school by ID',
    description: 'Retrieve a specific school by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'School retrieved successfully',
    type: SchoolResponseDto,
  })
  @ApiNotFoundResponse({ description: 'School not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<SchoolResponseDto> {
    const school = await this.schoolsService.findOne(id);
    return this.mapToResponseDto(school);
  }

  @Public()
  @Post('find-nearby')
  @ApiOperation({
    summary: 'Find schools near a zip code',
    description: 'Public endpoint used by intake forms to find schools near a provided zip code.',
  })
  async findNearby(@Body() dto: FindSchoolsByLocationDto) {
    return this.schoolsService.findNearbySchools(dto.zipCode, dto.radiusMiles);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Update a school',
    description: 'Update a school. Only super admins, school owners, and school admins can update schools.',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'School updated successfully',
    type: SchoolResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  @ApiNotFoundResponse({ description: 'School not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SchoolResponseDto> {
    // Check permissions: super admins can update any school
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
      // Fetch the school to check ownership
      const school = await this.schoolsService.findOne(id);
      
      if (user.primaryRole === AppRole.SCHOOL_OWNER) {
        // School owners can update any school they own
        if (school.ownerId !== user.id) {
          throw new ForbiddenException('You can only update schools you own');
        }
      } else if (user.primaryRole === AppRole.SCHOOL_ADMIN) {
        // School admins can only update their assigned school
        if (user.schoolId !== id) {
          throw new ForbiddenException('You can only update your own school');
        }
      } else {
        throw new ForbiddenException('Insufficient permissions to update schools');
      }
    }

    const school = await this.schoolsService.update(id, updateSchoolDto);
    return this.mapToResponseDto(school);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a school',
    description: 'Soft delete a school by setting its status to inactive. Only super admins and school owners can delete schools.',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'School deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'School not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    // Check permissions: super admins can delete any school
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
      // Fetch the school to check ownership
      const school = await this.schoolsService.findOne(id);
      
      // School owners can delete any school they own
      if (school.ownerId !== user.id) {
        throw new ForbiddenException('You can only delete schools you own');
      }
    }

    await this.schoolsService.remove(id);
  }

  @Patch(':id/status')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Update school status',
    description: 'Update the status of a school. Only super admins and school owners can update school status.',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateSchoolStatusDto,
    description: 'School status update data',
  })
  @ApiResponse({
    status: 200,
    description: 'School status updated successfully',
    type: SchoolResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status value' })
  @ApiNotFoundResponse({ description: 'School not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateSchoolStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SchoolResponseDto> {
    // Check permissions: super admins can update any school
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
      // Fetch the school to check ownership
      const school = await this.schoolsService.findOne(id);
      
      // School owners can update status of any school they own
      if (school.ownerId !== user.id) {
        throw new ForbiddenException('You can only update status of schools you own');
      }
    }

    const school = await this.schoolsService.updateStatus(id, updateStatusDto.status);
    return this.mapToResponseDto(school);
  }

  @Get(':id/analytics')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Get latest analytics for a school',
    description: 'Retrieve the latest analytics record for a school by metric type.',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'metricType',
    required: true,
    type: String,
    description: 'Metric type (e.g., staffing_ratios)',
    example: 'staffing_ratios',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        schoolId: { type: 'string' },
        metricType: { type: 'string' },
        metricValue: { type: 'object' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Analytics not found',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getSchoolAnalytics(
    @Param('id') schoolId: string,
    @Query('metricType') metricType: string,
    @CurrentUser() user: AuthUser,
  ) {
    // RBAC: Non-super admins can only access their own school's analytics
    if (user.primaryRole !== AppRole.SUPER_ADMIN && user.schoolId !== schoolId) {
      throw new ForbiddenException('You can only access analytics for your own school');
    }

    const analytics = await this.schoolsService.getLatestAnalytics(schoolId, metricType);

    if (!analytics) {
      throw new NotFoundException(`No analytics found for school ${schoolId} with metric type ${metricType}`);
    }

    return {
      id: analytics.id,
      schoolId: analytics.schoolId,
      metricType: analytics.metricType,
      metricValue: analytics.metricValue,
      createdAt: analytics.createdAt.toISOString(),
      updatedAt: analytics.updatedAt.toISOString(),
    };
  }

  @Post(':id/analytics/project-class-sizes')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Generate class size projections',
    description: 'Generate AI-powered class size projections for a school over a specified number of months.',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectionMonths: {
          type: 'number',
          description: 'Number of months to project (3, 6, or 12)',
          example: 6,
          minimum: 1,
          maximum: 12,
        },
      },
      required: ['projectionMonths'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Projections generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        projections: { type: 'object' },
        baselineData: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input or OpenAI API error' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async projectClassSizes(
    @Param('id') schoolId: string,
    @Body() body: { projectionMonths: number },
    @CurrentUser() user: AuthUser,
  ) {
    // RBAC: Non-super admins can only project for their own school
    if (user.primaryRole !== AppRole.SUPER_ADMIN && user.schoolId !== schoolId) {
      throw new ForbiddenException('You can only generate projections for your own school');
    }

    if (!body.projectionMonths || body.projectionMonths < 1 || body.projectionMonths > 12) {
      throw new BadRequestException('projectionMonths must be between 1 and 12');
    }

    const result = await this.schoolsService.projectClassSizes(schoolId, body.projectionMonths);

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to generate projections');
    }

    return result;
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(school: SchoolEntity): SchoolResponseDto {
    return {
      id: school.id,
      name: school.name,
      address: school.address,
      phone: school.phone,
      email: school.email,
      ownerId: school.ownerId,
      capacity: school.capacity,
      programsOffered: school.programsOffered,
      status: school.status,
      subscriptionStatus: school.subscriptionStatus,
      nextPaymentDue: school.nextPaymentDue,
      stripeCustomerId: school.stripeCustomerId,
      stripeSubscriptionId: school.stripeSubscriptionId,
      subscriptionAmount: school.subscriptionAmount,
      paidInAdvancePeriod: school.paidInAdvancePeriod,
      discountedAmount: school.discountedAmount,
      accessDisabled: school.accessDisabled,
      lastPaymentDate: school.lastPaymentDate,
      paymentRetryCount: school.paymentRetryCount,
      latitude: school.latitude,
      longitude: school.longitude,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    };
  }
}

