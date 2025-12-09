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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { UpdateClassStatusDto } from './dto/update-class-status.dto';
import { ClassResponseDto } from './dto/class-response.dto';
import { ClassEntity, ClassStatus } from './entities/class.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Create a new class',
    description: 'Create a new class. School admins and school owners can create classes for their school.',
  })
  @ApiResponse({
    status: 201,
    description: 'Class created successfully',
    type: ClassResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async create(
    @Body() createClassDto: CreateClassDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ClassResponseDto> {
    // Non-super admins can only create classes for their own school
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
      if (!user.schoolId || createClassDto.schoolId !== user.schoolId) {
        throw new ForbiddenException('You can only create classes for your own school');
      }
    }

    const classEntity = await this.classesService.create(createClassDto);
    return this.mapToResponseDto(classEntity);
  }

  @Get('capacity-by-program')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get class capacity aggregated by program',
    description: 'Get total capacity, enrollment, and available spots per program for a school.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: String,
    description: 'School ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Capacity data retrieved successfully',
    schema: {
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
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getCapacityByProgram(
    @Query('schoolId') schoolId: string,
    @CurrentUser() user: AuthUser,
  ) {
    // RBAC: Non-super admins can only access their own school
    if (user.primaryRole !== AppRole.SUPER_ADMIN && user.schoolId !== schoolId) {
      throw new ForbiddenException('You can only access capacity data for your own school');
    }

    const capacity = await this.classesService.getCapacityByProgram(schoolId);
    return capacity;
  }

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER, AppRole.PARENT)
  @ApiOperation({
    summary: 'Get all classes',
    description: 'Retrieve a list of classes with optional filtering. Super admins see all classes, others see only their school\'s classes. Teachers see their assigned classes.',
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
    enum: ClassStatus,
    description: 'Filter by class status',
  })
  @ApiQuery({
    name: 'teacherId',
    required: false,
    type: String,
    description: 'Filter by teacher ID',
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
    description: 'List of classes retrieved successfully',
    type: [ClassResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('status') status?: ClassStatus,
    @Query('teacherId') teacherId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: ClassResponseDto[]; total: number }> {
    // Teachers see their assigned classes
    if (user?.primaryRole === AppRole.TEACHER) {
      if (!user.id) {
        throw new ForbiddenException('User ID not found');
      }
      const result = await this.classesService.findByTeacher(user.id, {
        schoolId: user.schoolId || schoolId,
        status,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return {
        data: result.data.map((classEntity) => this.mapToResponseDto(classEntity)),
        total: result.total,
      };
    }

    // Non-super admins can only see their own school's classes
    const filterSchoolId = user?.primaryRole !== AppRole.SUPER_ADMIN
      ? user?.schoolId || schoolId
      : schoolId;

    const result = await this.classesService.findAll({
      schoolId: filterSchoolId,
      status,
      teacherId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    return {
      data: result.data.map((classEntity) => this.mapToResponseDto(classEntity)),
      total: result.total,
    };
  }

  @Get('active')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER, AppRole.PARENT)
  @ApiOperation({
    summary: 'Get active classes',
    description: 'Retrieve all active classes. Super admins see all, others see only their school\'s active classes.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active classes',
    type: [ClassResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findActive(
    @CurrentUser() user: AuthUser,
  ): Promise<ClassResponseDto[]> {
    const schoolId = user.primaryRole !== AppRole.SUPER_ADMIN ? user.schoolId : undefined;
    const classes = await this.classesService.findActive(schoolId || undefined);
    return classes.map((classEntity) => this.mapToResponseDto(classEntity));
  }

  @Get('statistics')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get class statistics',
    description: 'Get statistics for classes (total, by status, utilization rate).',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'School ID (required for non-super admins)',
  })
  @ApiResponse({
    status: 200,
    description: 'Class statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 25 },
        byStatus: {
          type: 'object',
          example: { open: 20, closed: 3, full: 2 },
        },
        openClasses: { type: 'number', example: 20 },
        totalCapacity: { type: 'number', example: 400 },
        totalEnrolled: { type: 'number', example: 350 },
        utilizationRate: { type: 'number', example: 87.5 },
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

    return this.classesService.getStatistics(filterSchoolId);
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.TEACHER, AppRole.PARENT)
  @ApiOperation({
    summary: 'Get a class by ID',
    description: 'Retrieve a specific class by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Class ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Class retrieved successfully',
    type: ClassResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ClassResponseDto> {
    const classEntity = await this.classesService.findOne(id);

    // Non-super admins can only see their own school's classes
    if (user.primaryRole !== AppRole.SUPER_ADMIN && classEntity.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only view classes for your own school');
    }

    return this.mapToResponseDto(classEntity);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Update a class',
    description: 'Update a class. Only super admins, school admins, and school owners can update classes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Class ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Class updated successfully',
    type: ClassResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ClassResponseDto> {
    const classEntity = await this.classesService.findOne(id);

    // Non-super admins can only update their own school's classes
    if (user.primaryRole !== AppRole.SUPER_ADMIN && classEntity.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only update classes for your own school');
    }

    // Non-super admins cannot change schoolId
    if (user.primaryRole !== AppRole.SUPER_ADMIN && updateClassDto.schoolId && updateClassDto.schoolId !== classEntity.schoolId) {
      throw new ForbiddenException('You cannot change the school ID');
    }

    const updatedClass = await this.classesService.update(id, updateClassDto);
    return this.mapToResponseDto(updatedClass);
  }

  @Patch(':id/status')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Update class status',
    description: 'Update the status of a class. Only super admins, school admins, and school owners can update class status.',
  })
  @ApiParam({
    name: 'id',
    description: 'Class ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateClassStatusDto,
    description: 'Class status update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Class status updated successfully',
    type: ClassResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status value' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateClassStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ClassResponseDto> {
    const classEntity = await this.classesService.findOne(id);

    // Non-super admins can only update their own school's classes
    if (user.primaryRole !== AppRole.SUPER_ADMIN && classEntity.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only update classes for your own school');
    }

    const updatedClass = await this.classesService.updateStatus(id, updateStatusDto.status);
    return this.mapToResponseDto(updatedClass);
  }

  @Patch(':id/teacher')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Assign teacher to class',
    description: 'Assign a teacher to a class. Only super admins, school admins, and school owners can assign teachers.',
  })
  @ApiParam({
    name: 'id',
    description: 'Class ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        teacherId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174001',
          description: 'Teacher user ID',
        },
      },
      required: ['teacherId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher assigned successfully',
    type: ClassResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid teacherId or role' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async assignTeacher(
    @Param('id') id: string,
    @Body('teacherId') teacherId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ClassResponseDto> {
    if (!teacherId) {
      throw new BadRequestException('teacherId is required');
    }
    const classEntity = await this.classesService.findOne(id);

    // Non-super admins can only assign teachers to their own school's classes
    if (user.primaryRole !== AppRole.SUPER_ADMIN && classEntity.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only assign teachers to classes in your own school');
    }

    const updatedClass = await this.classesService.assignTeacher(id, teacherId);
    return this.mapToResponseDto(updatedClass);
  }

  @Patch(':id/enrollment-count')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Update class enrollment count',
    description: 'Recalculate and update the enrollment count for a class. Only super admins, school admins, and school owners can update enrollment counts.',
  })
  @ApiParam({
    name: 'id',
    description: 'Class ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment count updated successfully',
    type: ClassResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateEnrollmentCount(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ClassResponseDto> {
    const classEntity = await this.classesService.findOne(id);

    // Non-super admins can only update their own school's classes
    if (user.primaryRole !== AppRole.SUPER_ADMIN && classEntity.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only update classes for your own school');
    }

    const updatedClass = await this.classesService.updateEnrollmentCount(id);
    return this.mapToResponseDto(updatedClass);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a class',
    description: 'Delete a class. Only super admins, school admins, and school owners can delete classes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Class ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Class deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const classEntity = await this.classesService.findOne(id);

    // Non-super admins can only delete their own school's classes
    if (user.primaryRole !== AppRole.SUPER_ADMIN && classEntity.schoolId !== user.schoolId) {
      throw new ForbiddenException('You can only delete classes for your own school');
    }

    await this.classesService.remove(id);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(classEntity: ClassEntity): ClassResponseDto {
    return {
      id: classEntity.id,
      schoolId: classEntity.schoolId,
      name: classEntity.name,
      teacherId: classEntity.teacherId,
      program: classEntity.program,
      description: classEntity.description,
      ageGroup: classEntity.ageGroup,
      capacity: classEntity.capacity,
      currentEnrollment: classEntity.currentEnrollment,
      startDate: classEntity.startDate,
      endDate: classEntity.endDate,
      status: classEntity.status,
      createdAt: classEntity.createdAt,
      updatedAt: classEntity.updatedAt,
    };
  }
}




