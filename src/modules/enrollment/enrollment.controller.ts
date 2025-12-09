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
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
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
  ApiConsumes,
} from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { SendEnrollmentPacketDto } from './dto/send-enrollment-packet.dto';
import { EnrollmentEntity, EnrollmentStatus } from './entities/enrollment.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
  ) {}

  private async ensureUserHasAccessToSchool(user: AuthUser, schoolId?: string): Promise<void> {
    if (!schoolId) {
      throw new BadRequestException('schoolId is required');
    }

    if (user.primaryRole === AppRole.SUPER_ADMIN) {
      return;
    }

    const accessibleSchoolIds = new Set<string>();
    if (user.schoolId) {
      accessibleSchoolIds.add(user.schoolId);
    }

    user.roles?.forEach((role) => {
      if (role.schoolId) {
        accessibleSchoolIds.add(role.schoolId);
      }
    });

    // For SCHOOL_OWNER, also get schools they own
    if (user.primaryRole === AppRole.SCHOOL_OWNER) {
      const ownedSchools = await this.schoolRepository.find({
        where: { ownerId: user.id },
        select: ['id'],
      });
      ownedSchools.forEach(school => accessibleSchoolIds.add(school.id));
    }

    if (!accessibleSchoolIds.has(schoolId)) {
      throw new ForbiddenException('You can only view data for your own school');
    }
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Create a new enrollment',
    description: 'Create a new enrollment. School admins, admissions staff, and school owners can create enrollments for their school.',
  })
  @ApiResponse({
    status: 201,
    description: 'Enrollment created successfully',
    type: EnrollmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async create(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EnrollmentResponseDto> {
    // Non-super admins can only create enrollments for their own school
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
      if (!user.schoolId || createEnrollmentDto.schoolId !== user.schoolId) {
        throw new ForbiddenException('You can only create enrollments for your own school');
      }
    }

    const enrollment = await this.enrollmentService.create(createEnrollmentDto, user.id);
    return this.mapToResponseDto(enrollment);
  }

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Get all enrollments',
    description: 'Retrieve a list of enrollments with optional filtering. Super admins see all enrollments, others see only their school\'s enrollments.',
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
    enum: EnrollmentStatus,
    description: 'Filter by enrollment status',
  })
  @ApiQuery({
    name: 'classId',
    required: false,
    type: String,
    description: 'Filter by class ID',
  })
  @ApiQuery({
    name: 'leadId',
    required: false,
    type: String,
    description: 'Filter by lead ID',
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
    description: 'List of enrollments retrieved successfully',
    type: [EnrollmentResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('status') status?: EnrollmentStatus,
    @Query('classId') classId?: string,
    @Query('leadId') leadId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: EnrollmentResponseDto[]; total: number }> {
    // Non-super admins can only see their own school's enrollments
    const filterSchoolId = user?.primaryRole !== AppRole.SUPER_ADMIN
      ? user?.schoolId || schoolId
      : schoolId;

    const result = await this.enrollmentService.findAll({
      schoolId: filterSchoolId,
      status,
      classId,
      leadId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    return {
      data: result.data.map((enrollment) => this.mapToResponseDto(enrollment)),
      total: result.total,
    };
  }

  @Get('active')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Get active enrollments',
    description: 'Retrieve all active enrollments. Super admins see all, others see only their school\'s active enrollments.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active enrollments',
    type: [EnrollmentResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findActive(
    @CurrentUser() user: AuthUser,
  ): Promise<EnrollmentResponseDto[]> {
    const schoolId = user.primaryRole !== AppRole.SUPER_ADMIN ? user.schoolId : undefined;
    const enrollments = await this.enrollmentService.findActive(schoolId || undefined);
    return enrollments.map((enrollment) => this.mapToResponseDto(enrollment));
  }

  @Get('active/lead-ids')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER, AppRole.PARENT)
  @ApiOperation({
    summary: 'Get active enrollment lead IDs',
    description: 'Returns only the lead IDs for active enrollments. Useful for filtering out enrolled leads from waitlists. Optionally filter by specific student IDs.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'Filter by school ID (optional, defaults to user\'s school for non-super admins)',
  })
  @ApiQuery({
    name: 'studentIds',
    required: false,
    type: String,
    description: 'Comma-separated list of student/lead IDs to filter by (optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lead IDs for active enrollments',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { type: 'string' },
          example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getActiveLeadIds(
    @Query('schoolId') schoolId?: string,
    @Query('studentIds') studentIds?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ success: boolean; data: string[] }> {
    // Non-super admins can only see their own school's enrollments
    const filterSchoolId = user?.primaryRole !== AppRole.SUPER_ADMIN
      ? user?.schoolId || schoolId
      : schoolId;

    // Parse comma-separated studentIds if provided
    const studentIdsArray = studentIds
      ? studentIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
      : undefined;

    const leadIds = await this.enrollmentService.getActiveLeadIds(
      filterSchoolId || undefined,
      studentIdsArray,
    );

    return {
      success: true,
      data: leadIds,
    };
  }

  @Get('with-lead-details')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Get all enrollments with lead details',
    description: 'Returns all enrollments with joined lead information (child_name, parent_name, parent_email, parent_phone, assigned_to) for a school.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: String,
    description: 'School ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollments with lead details',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          lead_id: { type: 'string', nullable: true },
          class_id: { type: 'string', nullable: true },
          program: { type: 'string', nullable: true },
          start_date: { type: 'string', nullable: true },
          end_date: { type: 'string', nullable: true },
          status: { type: 'string' },
          created_at: { type: 'string' },
          leads: {
            type: 'object',
            nullable: true,
            properties: {
              child_name: { type: 'string', nullable: true },
              parent_name: { type: 'string', nullable: true },
              parent_email: { type: 'string', nullable: true },
              parent_phone: { type: 'string', nullable: true },
              assigned_to: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAllWithLeadDetails(
    @Query('schoolId') schoolId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Array<{
    id: string;
    lead_id: string | null;
    class_id: string | null;
    program: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    created_at: string;
    leads: {
      child_name: string | null;
      parent_name: string | null;
      parent_email: string | null;
      parent_phone: string | null;
      assigned_to: string | null;
    } | null;
  }>> {
    await this.ensureUserHasAccessToSchool(user, schoolId);

    return this.enrollmentService.findAllWithLeadDetails(schoolId);
  }

  @Get('active/with-lead-details')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Get active enrollments with lead details',
    description: 'Returns active enrollments with joined lead information (child_name, parent_name, parent_email, parent_phone) for a school.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: String,
    description: 'School ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Active enrollments with lead details',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          lead_id: { type: 'string' },
          class_id: { type: 'string', nullable: true },
          program: { type: 'string', nullable: true },
          start_date: { type: 'string', nullable: true },
          end_date: { type: 'string', nullable: true },
          status: { type: 'string' },
          created_at: { type: 'string' },
          leads: {
            type: 'object',
            nullable: true,
            properties: {
              child_name: { type: 'string', nullable: true },
              parent_name: { type: 'string', nullable: true },
              parent_email: { type: 'string', nullable: true },
              parent_phone: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getActiveWithLeadDetails(
    @Query('schoolId') schoolId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Array<{
    id: string;
    lead_id: string;
    class_id: string | null;
    program: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    created_at: string;
    leads: {
      child_name: string | null;
      parent_name: string | null;
      parent_email: string | null;
      parent_phone: string | null;
    } | null;
  }>> {
    await this.ensureUserHasAccessToSchool(user, schoolId);

    return this.enrollmentService.findActiveWithLeadDetails(schoolId);
  }

  @Get('packet-tracking')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Get enrollment packet tracking by student IDs',
    description: 'Returns enrollment packet tracking status for multiple students.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: String,
    description: 'School ID',
  })
  @ApiQuery({
    name: 'studentIds',
    required: true,
    type: String,
    description: 'Comma-separated list of student/lead IDs',
  })
  @ApiResponse({
    status: 200,
    description: 'Packet tracking records',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          student_id: { type: 'string' },
          status: { type: 'string' },
          sent_at: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPacketTracking(
    @Query('schoolId') schoolId: string,
    @Query('studentIds') studentIds: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Array<{
    student_id: string;
    status: string;
    sent_at: string | null;
  }>> {
    await this.ensureUserHasAccessToSchool(user, schoolId);

    const studentIdsArray = studentIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    return this.enrollmentService.getPacketTrackingByStudentIds(schoolId, studentIdsArray);
  }

  @Get('family-active')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Check if families already have active enrollments',
    description: 'Returns a map of parent emails to whether they currently have an active enrollment.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: String,
    description: 'School ID',
  })
  @ApiQuery({
    name: 'emails',
    required: true,
    type: String,
    description: 'Comma-separated list of parent email addresses',
  })
  @ApiResponse({
    status: 200,
    description: 'Family active enrollment status',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          additionalProperties: { type: 'boolean' },
          example: {
            'parent@example.com': true,
            'another@example.com': false,
          },
        },
      },
    },
  })
  async getFamilyActiveStatus(
    @Query('schoolId') schoolId: string,
    @Query('emails') emails: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean; data: Record<string, boolean> }> {
    if (!schoolId) {
      throw new BadRequestException('schoolId is required');
    }

    if (!emails) {
      throw new BadRequestException('emails is required');
    }

    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
      if (!user.schoolId || user.schoolId !== schoolId) {
        throw new ForbiddenException('You can only view enrollment data for your own school');
      }
    }

    const emailList = emails
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const statusMap = await this.enrollmentService.getFamilyActiveStatus(schoolId, emailList);
    return {
      success: true,
      data: statusMap,
    };
  }

  @Get('statistics')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get enrollment statistics',
    description: 'Get statistics for enrollments (total, by status, by type, active, pending, completed).',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'School ID (required for non-super admins)',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        byStatus: {
          type: 'object',
          example: {
            pending: 20,
            active: 100,
            suspended: 5,
            completed: 15,
            withdrawn: 10,
          },
        },
        active: { type: 'number', example: 100 },
        pending: { type: 'number', example: 20 },
        completed: { type: 'number', example: 15 },
        suspended: { type: 'number', example: 5 },
        withdrawn: { type: 'number', example: 10 },
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

    return this.enrollmentService.getStatistics(filterSchoolId);
  }

  @Get('count-by-school')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Get enrollment counts by school IDs',
    description: 'Get active enrollment counts for multiple schools in a single query. Returns a map of schoolId -> count.',
  })
  @ApiQuery({
    name: 'schoolIds',
    required: true,
    type: String,
    description: 'Comma-separated list of school IDs',
    example: 'uuid1,uuid2,uuid3',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EnrollmentStatus,
    description: 'Filter by enrollment status (default: active)',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment counts retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: { type: 'number' },
      example: {
        'uuid1': 25,
        'uuid2': 18,
        'uuid3': 0,
      },
    },
  })
  async getCountsBySchools(
    @Query('schoolIds') schoolIds: string,
    @Query('status') status?: EnrollmentStatus,
  ): Promise<Record<string, number>> {
    if (!schoolIds) {
      throw new BadRequestException('schoolIds parameter is required');
    }

    const schoolIdArray = schoolIds.split(',').map((id) => id.trim()).filter(Boolean);
    
    if (schoolIdArray.length === 0) {
      throw new BadRequestException('At least one school ID is required');
    }

    return this.enrollmentService.getCountsBySchools(
      schoolIdArray,
      status || EnrollmentStatus.ACTIVE,
    );
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER, AppRole.PARENT)
  @ApiOperation({
    summary: 'Get an enrollment by ID',
    description: 'Retrieve a specific enrollment by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment retrieved successfully',
    type: EnrollmentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.enrollmentService.findOne(id);

    await this.ensureUserHasAccessToSchool(user, enrollment.schoolId);

    return this.mapToResponseDto(enrollment);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Update an enrollment',
    description: 'Update an enrollment. Only super admins, school admins, admissions staff, and school owners can update enrollments.',
  })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment updated successfully',
    type: EnrollmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.enrollmentService.findOne(id);

    await this.ensureUserHasAccessToSchool(user, enrollment.schoolId);

    // Non-super admins cannot change schoolId
    if (
      user.primaryRole !== AppRole.SUPER_ADMIN &&
      updateEnrollmentDto.schoolId &&
      updateEnrollmentDto.schoolId !== enrollment.schoolId
    ) {
      throw new ForbiddenException('You cannot change the school ID');
    }

    const updatedEnrollment = await this.enrollmentService.update(id, updateEnrollmentDto);
    return this.mapToResponseDto(updatedEnrollment);
  }

  @Patch(':id/status')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Update enrollment status',
    description: 'Update the status of an enrollment. Only super admins, school admins, admissions staff, and school owners can update enrollment status.',
  })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateEnrollmentStatusDto,
    description: 'Enrollment status update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment status updated successfully',
    type: EnrollmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status value' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateEnrollmentStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.enrollmentService.findOne(id);

    await this.ensureUserHasAccessToSchool(user, enrollment.schoolId);

    const endDate = updateStatusDto.endDate
      ? new Date(updateStatusDto.endDate)
      : undefined;

    const updatedEnrollment = await this.enrollmentService.updateStatus(
      id,
      updateStatusDto.status,
      endDate,
    );
    return this.mapToResponseDto(updatedEnrollment);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an enrollment',
    description: 'Delete an enrollment. Only super admins, school admins, and school owners can delete enrollments.',
  })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Enrollment deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const enrollment = await this.enrollmentService.findOne(id);

    // Non-super admins can only delete their own school's enrollments
    if (user.primaryRole !== AppRole.SUPER_ADMIN && enrollment.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only delete enrollments for your own school');
    }

    await this.enrollmentService.remove(id);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(enrollment: EnrollmentEntity): EnrollmentResponseDto {
    return {
      id: enrollment.id,
      leadId: enrollment.leadId,
      schoolId: enrollment.schoolId,
      classId: enrollment.classId,
      program: enrollment.program,
      startDate: enrollment.startDate,
      endDate: enrollment.endDate,
      status: enrollment.status,
      notes: enrollment.notes,
      tuitionAmount: enrollment.tuitionAmount,
      registrationFee: enrollment.registrationFee,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }

  @Post('packet/send')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          callback(new Error('Only PDF files are allowed'), false);
        } else {
          callback(null, true);
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload and send enrollment packet to parent',
    description: 'Uploads enrollment packet PDF to S3 and sends email to parent with download link',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'studentId', 'schoolId', 'parentEmail', 'studentName'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Enrollment packet PDF file (max 10MB)',
        },
        studentId: {
          type: 'string',
          format: 'uuid',
          description: 'Student/Lead ID',
        },
        schoolId: {
          type: 'string',
          format: 'uuid',
          description: 'School ID',
        },
        parentEmail: {
          type: 'string',
          format: 'email',
          description: 'Parent email address',
        },
        studentName: {
          type: 'string',
          description: 'Student name',
        },
        emailSubject: {
          type: 'string',
          description: 'Email subject (optional)',
        },
        emailMessage: {
          type: 'string',
          description: 'Email message body (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Enrollment packet uploaded and email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        fileUrl: { type: 'string', example: 'https://bucket.s3.region.amazonaws.com/path/to/file.pdf' },
        trackingId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or missing data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async sendEnrollmentPacket(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean; fileUrl: string; trackingId: string }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Extract form fields from multipart/form-data request body
    const dto: SendEnrollmentPacketDto = {
      studentId: req.body.studentId,
      schoolId: req.body.schoolId,
      parentEmail: req.body.parentEmail,
      studentName: req.body.studentName,
      emailSubject: req.body.emailSubject,
      emailMessage: req.body.emailMessage,
    };

    // Validate required fields
    if (!dto.studentId || !dto.schoolId || !dto.parentEmail || !dto.studentName) {
      throw new BadRequestException('Missing required fields: studentId, schoolId, parentEmail, studentName');
    }

    return this.enrollmentService.sendEnrollmentPacket(file, dto, user.id);
  }
}




