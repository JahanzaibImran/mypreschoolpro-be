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
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignResponseDto } from './dto/campaign-response.dto';
import { CampaignStatus } from '../../common/enums/campaign-status.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Campaign } from './entities/campaign.entity';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolEntity } from '../schools/entities/school.entity';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
  ) { }

  private async ensureUserCanManageSchool(user: AuthUser, schoolId?: string): Promise<void> {
    if (!schoolId) {
      throw new BadRequestException('schoolId is required');
    }

    if (user.primaryRole === AppRole.SUPER_ADMIN) {
      return;
    }

    const accessible = new Set<string>();
    if (user.schoolId) {
      accessible.add(user.schoolId);
    }
    user.roles?.forEach((role) => {
      if (role.schoolId) {
        accessible.add(role.schoolId);
      }
    });

    // Check if user owns the school
    const isOwner = await this.schoolRepository.count({
      where: { id: schoolId, ownerId: user.id },
    });

    if (isOwner > 0) {
      return;
    }

    if (!accessible.has(schoolId)) {
      throw new ForbiddenException('You can only manage your own school');
    }
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Create a new campaign',
    description: 'Create a new marketing campaign. School admins, admissions staff, and school owners can create campaigns for their school.',
  })
  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully',
    type: CampaignResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async create(
    @Body() createCampaignDto: CreateCampaignDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CampaignResponseDto> {
    await this.ensureUserCanManageSchool(user, createCampaignDto.schoolId);

    const campaign = await this.campaignsService.create(createCampaignDto, user.id);
    return this.mapToResponseDto(campaign);
  }

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get all campaigns',
    description: 'Retrieve a list of campaigns with optional filtering. Super admins see all campaigns, others see only their school\'s campaigns.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'Filter by school ID',
  })
  @ApiQuery({
    name: 'schoolIds',
    required: false,
    type: String,
    description: 'Comma-separated list of school IDs (for school owners with multiple schools)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CampaignStatus,
    description: 'Filter by campaign status',
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
    description: 'List of campaigns retrieved successfully',
    type: [CampaignResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('schoolIds') schoolIds?: string,
    @Query('status') status?: CampaignStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: CampaignResponseDto[]; total: number }> {
    let filterSchoolId: string | undefined;
    let filterSchoolIds: string[] | undefined;

    if (user?.primaryRole === AppRole.SUPER_ADMIN) {
      // Super admins can see all campaigns
      filterSchoolId = schoolId;
      filterSchoolIds = schoolIds ? schoolIds.split(',').map(id => id.trim()) : undefined;
    } else if (user?.primaryRole === AppRole.SCHOOL_OWNER || user?.primaryRole === AppRole.SCHOOL_ADMIN || user?.primaryRole === AppRole.ADMISSIONS_STAFF) {
      // For these roles, we should filter by specific school(s) they have access to
      if (schoolIds) {
        filterSchoolIds = schoolIds.split(',').map(id => id.trim());
        // Verify access to each school
        for (const id of filterSchoolIds) {
          try {
            await this.ensureUserCanManageSchool(user, id);
          } catch (e) {
            // If they can't access one of the requested schools, we might want to filter it out or throw
            // For now, let's just skip it
            filterSchoolIds = filterSchoolIds.filter(sid => sid !== id);
          }
        }
      } else if (schoolId) {
        filterSchoolId = schoolId;
        try {
          await this.ensureUserCanManageSchool(user, filterSchoolId);
        } catch (e) {
          return { data: [], total: 0 };
        }
      } else {
        // If no schoolId provided, use user's default schoolId
        filterSchoolId = user?.schoolId || undefined;
        if (!filterSchoolId && user?.primaryRole === AppRole.SCHOOL_OWNER) {
          // School owners without a default schoolId: we'd need to fetch their owned schools
          // For now, let's allow them to see all their owned schools if they don't filter
          // But the service needs to handle this. For now, let's keep it consistent.
        }
      }
    }

    const result = await this.campaignsService.findAll(
      {
        schoolId: filterSchoolId,
        schoolIds: filterSchoolIds,
        status,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      },
      user,
    );

    return {
      data: result.data.map((campaign) => this.mapToResponseDto(campaign)),
      total: result.total,
    };
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get a campaign by ID',
    description: 'Retrieve a specific campaign by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign retrieved successfully',
    type: CampaignResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.findOne(id);
    await this.campaignsService.ensureUserCanManageCampaign(campaign, user);
    return this.mapToResponseDto(campaign);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Update a campaign',
    description: 'Update a campaign. Only super admins, school admins, admissions staff, and school owners can update campaigns.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign updated successfully',
    type: CampaignResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignsService.findOne(id);
    await this.campaignsService.ensureUserCanManageCampaign(campaign, user);

    const updatedCampaign = await this.campaignsService.update(id, updateCampaignDto);
    return this.mapToResponseDto(updatedCampaign);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a campaign',
    description: 'Delete a campaign. Only super admins, school admins, admissions staff, and school owners can delete campaigns.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Campaign deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const campaign = await this.campaignsService.findOne(id);
    await this.campaignsService.ensureUserCanManageCampaign(campaign, user);
    await this.campaignsService.remove(id);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(campaign: Campaign): CampaignResponseDto {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      schoolId: campaign.schoolId,
      schoolName: campaign.school?.name,
      createdBy: campaign.createdBy,
      status: campaign.status,
      targetAudience: campaign.targetAudience,
      communicationChannels: campaign.communicationChannels,
      scheduledAt: campaign.scheduledAt?.toISOString() || null,
      sentAt: campaign.sentAt?.toISOString() || null,
      completedAt: campaign.completedAt?.toISOString() || null,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      openCount: campaign.openCount,
      clickCount: campaign.clickCount,
      failedCount: campaign.failedCount,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }
}

