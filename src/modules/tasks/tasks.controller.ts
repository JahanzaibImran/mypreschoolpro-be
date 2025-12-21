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
  ParseUUIDPipe,
  ParseEnumPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { TaskStatusType } from '../../common/enums/task-status-type.enum';
import { TaskPriorityType } from '../../common/enums/task-priority-type.enum';
import { Task } from './entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity } from '../users/entities/profile.entity';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) { }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: AuthUser,
  ): Promise<TaskResponseDto> {
    // Ensure user has access to the school if schoolId is provided
    if (createTaskDto.schoolId && user.primaryRole !== AppRole.SUPER_ADMIN) {
      const accessibleSchoolIds = new Set<string>();
      if (user.schoolId) accessibleSchoolIds.add(user.schoolId);
      user.roles?.forEach(role => {
        if (role.schoolId) accessibleSchoolIds.add(role.schoolId);
      });
      if (user.primaryRole === AppRole.SCHOOL_OWNER) {
        // This check is handled in service
      }
      if (!accessibleSchoolIds.has(createTaskDto.schoolId)) {
        throw new ForbiddenException('You do not have permission to create tasks for this school.');
      }
    }

    const task = await this.tasksService.create(createTaskDto, user.id);

    // Fetch assignee profile if assigned
    let assigneeMap = new Map<string, { firstName: string | null; lastName: string | null; email: string }>();
    if (task.assignedTo) {
      const profile = await this.profileRepository.findOne({
        where: { id: task.assignedTo },
        select: ['id', 'firstName', 'lastName', 'email'],
      });
      if (profile) {
        assigneeMap.set(profile.id, {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
      }
    }

    return this.mapToResponseDto(task, assigneeMap);
  }

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiQuery({ name: 'schoolId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatusType })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriorityType })
  @ApiQuery({ name: 'assignedTo', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of tasks',
    type: [TaskResponseDto],
  })
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('status') status?: TaskStatusType,
    @Query('priority') priority?: TaskPriorityType,
    @Query('assignedTo') assignedTo?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<TaskResponseDto[]> {
    const { tasks } = await this.tasksService.findAll(user!, {
      schoolId,
      status,
      priority,
      assignedTo,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
      offset: offset ? parseInt(offset.toString(), 10) : undefined,
    });

    // Fetch assignee profiles for tasks
    const assigneeIds = [...new Set(tasks.map(t => t.assignedTo).filter(Boolean) as string[])];
    const assigneeMap = new Map<string, { firstName: string | null; lastName: string | null; email: string }>();

    if (assigneeIds.length > 0) {
      const profiles = await this.profileRepository.find({
        where: assigneeIds.map(id => ({ id })),
        select: ['id', 'firstName', 'lastName', 'email'],
      });
      profiles.forEach(profile => {
        assigneeMap.set(profile.id, {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
      });
    }

    return tasks.map(task => this.mapToResponseDto(task, assigneeMap));
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: 200,
    description: 'Task found',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.findOne(id, user);

    // Fetch assignee profile if assigned
    let assigneeMap = new Map<string, { firstName: string | null; lastName: string | null; email: string }>();
    if (task.assignedTo) {
      const profile = await this.profileRepository.findOne({
        where: { id: task.assignedTo },
        select: ['id', 'firstName', 'lastName', 'email'],
      });
      if (profile) {
        assigneeMap.set(profile.id, {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
      }
    }

    return this.mapToResponseDto(task, assigneeMap);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.update(id, updateTaskDto, user);

    // Fetch assignee profile if assigned
    let assigneeMap = new Map<string, { firstName: string | null; lastName: string | null; email: string }>();
    if (task.assignedTo) {
      const profile = await this.profileRepository.findOne({
        where: { id: task.assignedTo },
        select: ['id', 'firstName', 'lastName', 'email'],
      });
      if (profile) {
        assigneeMap.set(profile.id, {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
      }
    }

    return this.mapToResponseDto(task, assigneeMap);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: 200,
    description: 'Task deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    await this.tasksService.remove(id, user);
    return { message: 'Task deleted successfully' };
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(
    task: Task,
    assigneeMap?: Map<string, { firstName: string | null; lastName: string | null; email: string }>,
  ): TaskResponseDto {
    const assignee = task.assignedTo && assigneeMap?.get(task.assignedTo)
      ? {
        firstName: assigneeMap.get(task.assignedTo)!.firstName,
        lastName: assigneeMap.get(task.assignedTo)!.lastName,
        email: assigneeMap.get(task.assignedTo)!.email,
      }
      : null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate?.toISOString() || null,
      assignedTo: task.assignedTo,
      schoolId: task.schoolId,
      createdBy: task.createdBy,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      assignee,
      school: task.school ? {
        id: task.school.id,
        name: task.school.name,
      } : null,
    };
  }
}

