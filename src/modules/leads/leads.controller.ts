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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
import { AnalyzeWaitlistLeadDto, LeadAnalysisResponseDto } from './dto/analyze-waitlist-lead.dto';
import { LeadActivityResponseDto } from './dto/lead-activity-response.dto';
import { LeadReminderResponseDto } from './dto/lead-reminder-response.dto';
import { LeadEntity, LeadStatus, LeadSource } from './entities/lead.entity';
import { LeadActivity } from './entities/lead-activity.entity';
import { LeadReminder } from './entities/lead-reminder.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Public } from '../../common/decorators/public.decorator';
import { CreateParentLeadDto } from './dto/create-parent-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { ReminderStatusType } from '../../common/enums/reminder-status-type.enum';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @Post('public')
  @ApiOperation({
    summary: 'Submit a lead from a public form',
    description: 'Used by marketing or website forms to submit a new lead without authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Lead submitted successfully',
    type: LeadResponseDto,
  })
  async createFromPublicForm(
    @Body() createLeadDto: CreateLeadDto,
  ): Promise<LeadResponseDto> {
    const lead = await this.leadsService.createPublicLead(createLeadDto);
    return this.mapToResponseDto(lead);
  }

  @Public()
  @Post('parent')
  @ApiOperation({
    summary: 'Parent registration lead',
    description: 'Captures parent onboarding information, optionally placing them on the waitlist.',
  })
  @ApiResponse({
    status: 201,
    description: 'Parent lead created successfully',
    type: LeadResponseDto,
  })
  async createParentLead(
    @Body() createParentLeadDto: CreateParentLeadDto,
  ): Promise<LeadResponseDto> {
    const lead = await this.leadsService.createParentLead(createParentLeadDto);
    return this.mapToResponseDto(lead);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Create a new lead',
    description: 'Create a new lead. School admins, admissions staff, and school owners can create leads for their school.',
  })
  @ApiResponse({
    status: 201,
    description: 'Lead created successfully',
    type: LeadResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async create(
    @Body() createLeadDto: CreateLeadDto,
    @CurrentUser() user: AuthUser,
  ): Promise<LeadResponseDto> {
    // Non-super admins can only create leads for their own school
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
      if (!user.schoolId || createLeadDto.schoolId !== user.schoolId) {
        throw new ForbiddenException('You can only create leads for your own school');
      }
    }

    const lead = await this.leadsService.create(createLeadDto, user.id);
    return this.mapToResponseDto(lead);
  }

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Get all leads',
    description: 'Retrieve a list of leads with optional filtering. Super admins see all leads, others see only their school\'s leads.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'Filter by school ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: LeadStatus,
    description: 'Filter by lead status',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: LeadSource,
    description: 'Filter by lead source',
  })
  @ApiQuery({
    name: 'assignedTo',
    required: false,
    type: String,
    description: 'Filter by assigned user ID',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status (true/false)',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Filter leads created on or after this date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Filter leads created on or before this date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'hasTourDate',
    required: false,
    type: Boolean,
    description: 'Filter leads that have a tour date (true) or don\'t have one (false)',
  })
  @ApiQuery({
    name: 'tourDate',
    required: false,
    type: String,
    description: 'Filter leads by specific tour date (YYYY-MM-DD)',
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
    name: 'orderBy',
    required: false,
    type: String,
    description: 'Field to order by (created_at, updated_at, lead_status, parent_email, child_name)',
    example: 'created_at',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'List of leads retrieved successfully',
    type: [LeadResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('status') status?: LeadStatus,
    @Query('source') source?: LeadSource,
    @Query('assignedTo') assignedTo?: string,
    @Query('parentEmail') parentEmail?: string,
    @Query('isActive') isActive?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('hasTourDate') hasTourDate?: string,
    @Query('tourDate') tourDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('orderBy') orderBy?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: LeadResponseDto[]; total: number }> {
    // Non-super admins can only see their own school's leads
    const filterSchoolId = user?.primaryRole !== AppRole.SUPER_ADMIN
      ? user?.schoolId || schoolId
      : schoolId;

    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
    const hasTourDateBool = hasTourDate !== undefined ? hasTourDate === 'true' : undefined;

    const result = await this.leadsService.findAll({
      schoolId: filterSchoolId,
      status,
      source,
      assignedTo,
      parentEmail,
      isActive: isActiveBool,
      fromDate,
      toDate,
      hasTourDate: hasTourDateBool,
      tourDate,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      orderBy,
      order,
    });

    return {
      data: result.data.map((lead) => this.mapToResponseDto(lead)),
      total: result.total,
    };
  }

  @Get('waitlist-queue')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get waitlist queue with positions and capacity data',
    description: 'Retrieve leads for waitlist management with calculated positions, sibling info, and program capacity.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'School ID (required for non-super admins)',
  })
  @ApiQuery({
    name: 'program',
    required: false,
    type: String,
    description: 'Filter by program',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by lead status',
  })
  @ApiQuery({
    name: 'assignedTo',
    required: false,
    type: String,
    description: 'Filter by assigned staff member ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist queue retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              leadId: { type: 'string' },
              schoolId: { type: 'string' },
              program: { type: 'string' },
              waitlistPosition: { type: 'number' },
              priorityScore: { type: 'number' },
              status: { type: 'string' },
              notes: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              programPosition: { type: 'string' },
              availableSpots: { type: 'number' },
              hasSiblings: { type: 'boolean' },
              lead: {
                type: 'object',
                properties: {
                  childName: { type: 'string' },
                  parentName: { type: 'string' },
                  parentEmail: { type: 'string' },
                  parentPhone: { type: 'string' },
                  childBirthdate: { type: 'string' },
                  assignedTo: { type: 'string' },
                  leadStatus: { type: 'string' },
                  paymentStatus: { type: 'string' },
                },
              },
            },
          },
        },
        capacityByProgram: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              capacity: { type: 'number' },
              enrolled: { type: 'number' },
              available: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getWaitlistQueue(
    @Query('schoolId') schoolId?: string,
    @Query('program') program?: string,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    const filterSchoolId = user?.primaryRole !== AppRole.SUPER_ADMIN
      ? user?.schoolId || schoolId
      : schoolId;

    if (!filterSchoolId) {
      throw new BadRequestException('schoolId is required');
    }

    const result = await this.leadsService.getWaitlistQueue({
      schoolId: filterSchoolId,
      program,
      status,
      assignedTo,
    });

    return result;
  }

  @Get('follow-up')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get leads needing follow-up',
    description: 'Retrieve leads that need follow-up (follow-up date is today or in the past).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of leads needing follow-up',
    type: [LeadResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findLeadsNeedingFollowUp(
    @CurrentUser() user: AuthUser,
  ): Promise<LeadResponseDto[]> {
    const schoolId = user.primaryRole !== AppRole.SUPER_ADMIN ? user.schoolId : undefined;
    const leads = await this.leadsService.findLeadsNeedingFollowUp(schoolId || undefined);
    return leads.map((lead) => this.mapToResponseDto(lead));
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get leads count',
    description: 'Get the total count of leads, optionally filtered by status.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by lead status (e.g., new)',
    example: 'new',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'Filter by school ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 50 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getLeadsCount(
    @Query('status') status?: string,
    @Query('schoolId') schoolId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ count: number }> {
    const count = await this.leadsService.countLeads(status as LeadStatus, schoolId, user);
    return { count };
  }

  @Get('statistics')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get lead statistics',
    description: 'Get statistics for leads (total, by status, by source, conversion rate).',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'School ID (required for non-super admins)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        byStatus: {
          type: 'object',
          example: { new: 50, contacted: 30, qualified: 20, converted: 40, lost: 10, nurturing: 0 },
        },
        bySource: {
          type: 'object',
          example: { website: 80, referral: 40, walk_in: 20, phone: 10 },
        },
        converted: { type: 'number', example: 40 },
        conversionRate: { type: 'number', example: 26.67 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getStatistics(
    @Query('schoolId') schoolId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<any> {
    const filterSchoolId = user?.primaryRole !== AppRole.SUPER_ADMIN
      ? user?.schoolId || schoolId
      : schoolId;

    if (!filterSchoolId) {
      throw new BadRequestException('schoolId is required');
    }

    return this.leadsService.getStatistics(filterSchoolId);
  }

  @Get('activities')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get lead activities for a school',
    description: 'Retrieve recent lead activities filtered by activity types.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'School ID (required for non-super admins)',
  })
  @ApiQuery({
    name: 'activityTypes',
    required: false,
    type: String,
    description: 'Comma-separated list of activity types to include (e.g. email_sent,sms_sent)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of activities to return (default 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead activities retrieved successfully',
    type: [LeadActivityResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getActivities(
    @Query('schoolId') schoolId?: string,
    @Query('activityTypes') activityTypes?: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<LeadActivityResponseDto[]> {
    const filterSchoolId = user?.primaryRole !== AppRole.SUPER_ADMIN
      ? user?.schoolId || schoolId
      : schoolId;

    if (!filterSchoolId) {
      throw new BadRequestException('schoolId is required');
    }

    const activityTypeList = activityTypes
      ? activityTypes.split(',').map((type) => type.trim()).filter((type) => type.length > 0)
      : undefined;

    const activities = await this.leadsService.getActivitiesBySchool(filterSchoolId, {
      activityTypes: activityTypeList,
      limit: limit ? Number(limit) : undefined,
    });

    return activities.map((activity) => this.mapActivityToResponse(activity));
  }

  @Get('activities/by-lead-ids')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get lead activities by lead IDs',
    description: 'Retrieve lead activities for specific lead IDs, optionally filtered by activity types.',
  })
  @ApiQuery({
    name: 'leadIds',
    required: true,
    type: String,
    description: 'Comma-separated list of lead IDs',
  })
  @ApiQuery({
    name: 'activityTypes',
    required: false,
    type: String,
    description: 'Comma-separated list of activity types to include (e.g. email_sent,sms_sent)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead activities retrieved successfully',
    type: [LeadActivityResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getActivitiesByLeadIds(
    @Query('leadIds') leadIds: string,
    @Query('activityTypes') activityTypes?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LeadActivityResponseDto[]> {
    if (!leadIds) {
      throw new BadRequestException('leadIds is required');
    }

    const leadIdList = leadIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (leadIdList.length === 0) {
      return [];
    }

    const activityTypeList = activityTypes
      ? activityTypes.split(',').map((type) => type.trim()).filter((type) => type.length > 0)
      : undefined;

    const activities = await this.leadsService.getActivitiesByLeadIds(leadIdList, {
      activityTypes: activityTypeList,
    });

    return activities.map((activity) => this.mapActivityToResponse(activity));
  }

  @Post(':id/activities')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Log a lead activity (contact interaction)',
    description: 'Create a new activity record for a lead (e.g., email sent, phone call, note).',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: CreateLeadActivityDto,
    description: 'Activity data',
  })
  @ApiResponse({
    status: 201,
    description: 'Activity logged successfully',
    type: LeadActivityResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async logActivity(
    @Param('id') leadId: string,
    @Body() createActivityDto: CreateLeadActivityDto,
    @CurrentUser() user: AuthUser,
  ): Promise<LeadActivityResponseDto> {
    // Verify user has access to this lead's school
    const lead = await this.leadsService.findOne(leadId);
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
      if (!user.schoolId || lead.schoolId !== user.schoolId) {
        throw new ForbiddenException('You can only log activities for leads in your school');
      }
    }

    // Map contact type to activity type
    const activityTypeMap: Record<string, string> = {
      email: 'email_sent',
      phone: 'phone_call',
      note: 'note_logged',
    };
    const activityType = activityTypeMap[createActivityDto.activityType] || 'note_logged';

    // Build notes from subject and content
    const notes = createActivityDto.subject
      ? `[${createActivityDto.subject}] ${createActivityDto.content}`
      : createActivityDto.content;

    const activity = await this.leadsService.logActivity(leadId, {
      activityType,
      notes,
      userId: user.id,
      metadata: {
        contactType: createActivityDto.activityType,
        subject: createActivityDto.subject,
      },
    });

    return this.mapActivityToResponse(activity);
  }

  @Get('reminders')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get lead reminders for a user',
    description: 'Retrieve lead reminders (tasks) assigned to a specific user.',
  })
  @ApiQuery({
    name: 'assignedTo',
    required: false,
    type: String,
    description: 'User ID to filter reminders by (defaults to current user for non-super admins)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead reminders retrieved successfully',
    type: [LeadReminderResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getReminders(
    @Query('assignedTo') assignedTo: string | undefined,
    @CurrentUser() user: AuthUser,
  ): Promise<LeadReminderResponseDto[]> {
    const targetUserId =
      user.primaryRole === AppRole.SUPER_ADMIN && assignedTo ? assignedTo : user.id;

    const reminders = await this.leadsService.getRemindersByAssignee(targetUserId);

    return reminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description ?? null,
      reminderType: reminder.reminderType,
      scheduledFor: reminder.scheduledFor.toISOString(),
      status: reminder.status,
      createdAt: reminder.createdAt.toISOString(),
      leadName: reminder.lead?.childName || null,
    }));
  }

  @Patch('reminders/:id/status')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Update reminder status',
    description: 'Update the status of a lead reminder (e.g., mark as completed).',
  })
  @ApiParam({
    name: 'id',
    description: 'Reminder ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(ReminderStatusType),
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reminder status updated successfully',
    type: LeadReminderResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateReminderStatus(
    @Param('id') id: string,
    @Body('status') status: ReminderStatusType,
    @CurrentUser() user: AuthUser,
  ): Promise<LeadReminderResponseDto> {
    const reminder = await this.leadsService.updateReminderStatus(id, status);

    // Only allow owners of the reminder or super admins to update
    if (user.primaryRole !== AppRole.SUPER_ADMIN && reminder.assignedTo !== user.id) {
      throw new ForbiddenException('You can only update your own reminders');
    }

    return {
      id: reminder.id,
      title: reminder.title,
      description: reminder.description ?? null,
      reminderType: reminder.reminderType,
      scheduledFor: reminder.scheduledFor.toISOString(),
      status: reminder.status,
      createdAt: reminder.createdAt.toISOString(),
      leadName: reminder.lead?.childName || null,
    };
  }

  @Get('parent/me')
  @Roles(AppRole.PARENT)
  @ApiOperation({
    summary: 'Get leads for the authenticated parent',
    description: 'Parents can view all of their submitted leads.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of parent leads retrieved successfully',
    type: [LeadResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getParentLeads(
    @CurrentUser() user: AuthUser,
  ): Promise<LeadResponseDto[]> {
    if (!user.email) {
      throw new BadRequestException('User email not found');
    }

    const leads = await this.leadsService.findByParentEmail(user.email);
    return leads.map((lead) => this.mapToResponseDto(lead));
  }

  @Get('invoices')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get lead invoices by school',
    description: 'Get recent lead invoices for a school, ordered by creation date.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: String,
    description: 'School ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of invoices to return (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead invoices retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          leadId: { type: 'string' },
          schoolId: { type: 'string' },
          parentEmail: { type: 'string' },
          amount: { type: 'number' },
          invoiceNumber: { type: 'string' },
          status: { type: 'string' },
          dueDate: { type: 'string', nullable: true },
          sentAt: { type: 'string', nullable: true },
          paidAt: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string' },
          lead: {
            type: 'object',
            properties: {
              childName: { type: 'string' },
              parentName: { type: 'string' },
              leadStatus: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getLeadInvoices(
    @Query('schoolId') schoolId: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: AuthUser,
  ) {
    // RBAC: Non-super admins can only access their own school
    if (user && user.primaryRole !== AppRole.SUPER_ADMIN && user.schoolId !== schoolId) {
      throw new ForbiddenException('You can only access invoices for your own school');
    }

    const invoices = await this.leadsService.getLeadInvoicesBySchool(
      schoolId,
      limit ? parseInt(limit.toString(), 10) : 10,
    );

    return invoices.map((invoice) => ({
      id: invoice.id,
      leadId: invoice.leadId,
      schoolId: invoice.schoolId,
      parentEmail: invoice.parentEmail,
      amount: parseFloat(invoice.amount.toString()),
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      dueDate: invoice.dueDate?.toISOString() || null,
      sentAt: invoice.sentAt?.toISOString() || null,
      paidAt: invoice.paidAt?.toISOString() || null,
      notes: invoice.notes || null,
      createdAt: invoice.createdAt.toISOString(),
      lead: invoice.lead
        ? {
            childName: invoice.lead.childName || null,
            parentName: invoice.lead.parentName || null,
            leadStatus: invoice.lead.leadStatus || null,
          }
        : null,
    }));
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Get a lead by ID',
    description: 'Retrieve a specific lead by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead retrieved successfully',
    type: LeadResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<LeadResponseDto> {
    const lead = await this.leadsService.findOne(id);

    // Non-super admins can only see their own school's leads
    if (user.primaryRole !== AppRole.SUPER_ADMIN && lead.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only view leads for your own school');
    }

    return this.mapToResponseDto(lead);
  }

  @Post('analysis/waitlist')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Analyze waitlist lead',
    description: 'Generates AI-style insights and recommendations for a waitlist lead.',
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis generated successfully',
    type: LeadAnalysisResponseDto,
  })
  async analyzeWaitlistLead(
    @Body() analyzeDto: AnalyzeWaitlistLeadDto,
    @CurrentUser() user: AuthUser,
  ): Promise<LeadAnalysisResponseDto> {
    return this.leadsService.analyzeWaitlistLead(analyzeDto, user.id);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Update a lead',
    description: 'Update a lead. Teachers can update leads for students in their classes. Super admins, school admins, admissions staff, and school owners can update any lead in their school.',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead updated successfully',
    type: LeadResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: AuthUser,
  ): Promise<LeadResponseDto> {
    const lead = await this.leadsService.findOne(id);

    // Non-super admins can only update their own school's leads
    if (user.primaryRole !== AppRole.SUPER_ADMIN && lead.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only update leads for your own school');
    }

    // Non-super admins cannot change schoolId
    if (user.primaryRole !== AppRole.SUPER_ADMIN && updateLeadDto.schoolId && updateLeadDto.schoolId !== lead.schoolId) {
      throw new ForbiddenException('You cannot change the school ID');
    }

    // Note: Teacher access to specific students is handled by RLS policies in the database
    // Teachers can update leads for students in their classes via enrollment → class → teacher_id

    const updatedLead = await this.leadsService.update(id, updateLeadDto, user.id);
    return this.mapToResponseDto(updatedLead);
  }

  @Patch(':id/status')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Update lead status',
    description: 'Update the status of a lead. Only super admins, school admins, admissions staff, and school owners can update lead status.',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateLeadStatusDto,
    description: 'Lead status update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead status updated successfully',
    type: LeadResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status value' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateLeadStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<LeadResponseDto> {
    const lead = await this.leadsService.findOne(id);

    // Non-super admins can only update their own school's leads
    if (user.primaryRole !== AppRole.SUPER_ADMIN && lead.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only update leads for your own school');
    }

    const followUpDate = updateStatusDto.followUpDate
      ? new Date(updateStatusDto.followUpDate)
      : undefined;

    const updatedLead = await this.leadsService.updateStatus(
      id,
      updateStatusDto.status,
      followUpDate,
      user.id,
    );
    return this.mapToResponseDto(updatedLead);
  }

  @Patch(':id/assign')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Assign lead to a user',
    description: 'Assign a lead to a staff member. Only super admins, school admins, and school owners can assign leads.',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: AssignLeadDto })
  @ApiResponse({
    status: 200,
    description: 'Lead assigned successfully',
    type: LeadResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid userId' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async assignTo(
    @Param('id') id: string,
    @Body() assignLeadDto: AssignLeadDto,
    @CurrentUser() user: AuthUser,
  ): Promise<LeadResponseDto> {
    if (!assignLeadDto.userId) {
      throw new BadRequestException('userId is required');
    }

    const lead = await this.leadsService.findOne(id);

    // Non-super admins can only assign their own school's leads
    if (user.primaryRole !== AppRole.SUPER_ADMIN && lead.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only assign leads for your own school');
    }

    const updatedLead = await this.leadsService.assignTo(
      id,
      assignLeadDto.userId,
      user.id,
      assignLeadDto.note,
    );
    return this.mapToResponseDto(updatedLead);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a lead',
    description: 'Delete a lead. Only super admins, school admins, and school owners can delete leads.',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Lead deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const lead = await this.leadsService.findOne(id);

    // Non-super admins can only delete their own school's leads
    if (user.primaryRole !== AppRole.SUPER_ADMIN && lead.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only delete leads for your own school');
    }

    await this.leadsService.remove(id, user.id);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(lead: LeadEntity): LeadResponseDto {
    // Split names back into first/last
    const parentNameParts = (lead.parentName || '').split(' ', 2);
    const parentFirstName = parentNameParts[0] || null;
    const parentLastName = parentNameParts[1] || null;
    
    const childNameParts = (lead.childName || '').split(' ', 2);
    const childFirstName = childNameParts[0] || null;
    const childLastName = childNameParts[1] || null;

    return {
      id: lead.id,
      parentFirstName,
      parentLastName,
      parentName: lead.parentName,
      email: lead.parentEmail,
      phone: lead.parentPhone,
      alternatePhone: lead.secondaryContactPhone,
      childFirstName,
      childLastName,
      childName: lead.childName,
      childDateOfBirth: lead.childBirthdate,
      childAgeGroup: null, // Not in database schema
      schoolId: lead.schoolId,
      programInterest: lead.program,
      preferredStartDate: null, // Not in database schema
      status: lead.leadStatus,
      source: lead.leadSource,
      notes: lead.notes,
      internalNotes: null, // Not in database schema
      followUpDate: lead.followUpDate,
      nextFollowUpAt: lead.nextFollowUpAt,
      assignedTo: lead.assignedTo,
      leadScore: lead.leadScore ?? null,
      priorityScore: lead.priorityScore ?? null,
      urgency: lead.urgency ?? null,
      convertedToEnrollmentId: null, // Not in database schema
      convertedAt: lead.conversionDate || null,
      metadata: null,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  @Post(':id/send-invoice')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Send invoice to lead with enrollment date',
    description: 'Create and send a registration invoice to a lead with enrollment date. Updates lead status to invoice_sent.',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Invoice amount' },
        enrollmentDate: { type: 'string', format: 'date', description: 'Enrollment date (YYYY-MM-DD)' },
        dueDate: { type: 'string', format: 'date', description: 'Due date (YYYY-MM-DD)' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['amount', 'enrollmentDate', 'dueDate'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice sent successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        invoiceNumber: { type: 'string' },
        amount: { type: 'number' },
        status: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input or lead missing email' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  async sendInvoice(
    @Param('id') leadId: string,
    @Body() body: { amount: number; enrollmentDate: string; dueDate: string; notes?: string },
    @CurrentUser() user: AuthUser,
  ) {
    const lead = await this.leadsService.findOne(leadId);

    // RBAC: Non-super admins can only send invoices for their own school
    if (user.primaryRole !== AppRole.SUPER_ADMIN && lead.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only send invoices for leads in your own school');
    }

    const invoice = await this.leadsService.sendLeadInvoiceWithEnrollment(
      leadId,
      body.amount,
      body.enrollmentDate,
      body.dueDate,
      body.notes || '',
      user.id,
    );

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: parseFloat(invoice.amount.toString()),
      status: invoice.status,
    };
  }

  private mapActivityToResponse(activity: LeadActivity): LeadActivityResponseDto {
    return {
      id: activity.id,
      leadId: activity.leadId,
      userId: activity.userId ?? null,
      activityType: activity.activityType,
      notes: activity.notes ?? null,
      createdAt: activity.createdAt.toISOString(),
      leadName: activity.lead?.childName || null,
      parentName: activity.lead?.parentName || null,
      parentEmail: activity.lead?.parentEmail || null,
    };
  }
}

