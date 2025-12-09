import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AppRole } from '../../common/enums/app-role.enum';
import { SchoolEntity } from '../schools/entities/school.entity';
import { TaskStatusType } from '../../common/enums/task-status-type.enum';
import { TaskPriorityType } from '../../common/enums/task-priority-type.enum';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
  ) {}

  /**
   * Create a new task
   */
  async create(createTaskDto: CreateTaskDto, createdBy: string): Promise<Task> {
    this.logger.log(`Creating task: ${createTaskDto.title}`);

    // Ensure user has access to the school if schoolId is provided
    if (createTaskDto.schoolId) {
      // Access check will be done in controller
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      createdBy,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
      priority: createTaskDto.priority || TaskPriorityType.MEDIUM,
      status: createTaskDto.status || TaskStatusType.PENDING,
    });

    return this.taskRepository.save(task);
  }

  /**
   * Find all tasks with access control
   */
  async findAll(user: AuthUser, options?: {
    schoolId?: string;
    status?: TaskStatusType;
    priority?: TaskPriorityType;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: Task[]; total: number }> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.school', 'school');

    // Access control
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
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

      if (accessibleSchoolIds.size > 0) {
        query.andWhere('(task.school_id IN (:...schoolIds) OR task.school_id IS NULL)', {
          schoolIds: Array.from(accessibleSchoolIds),
        });
      } else {
        // User has no school access, only show tasks they created or are assigned to
        query.andWhere('(task.created_by = :userId OR task.assigned_to = :userId)', { userId: user.id });
      }
    }

    // Filter by school if specified
    if (options?.schoolId) {
      query.andWhere('task.school_id = :schoolId', { schoolId: options.schoolId });
    }

    // Filter by status
    if (options?.status) {
      query.andWhere('task.status = :status', { status: options.status });
    }

    // Filter by priority
    if (options?.priority) {
      query.andWhere('task.priority = :priority', { priority: options.priority });
    }

    // Filter by assigned to
    if (options?.assignedTo) {
      query.andWhere('task.assigned_to = :assignedTo', { assignedTo: options.assignedTo });
    }

    const total = await query.getCount();

    if (options?.limit) {
      query.limit(options.limit);
    }
    if (options?.offset) {
      query.offset(options.offset);
    }

    query.orderBy('task.createdAt', 'DESC');

    const tasks = await query.getMany();

    return { tasks, total };
  }

  /**
   * Find one task by ID
   */
  async findOne(id: string, user: AuthUser): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['school'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    // Access control
    await this.ensureUserCanAccessTask(user, task);

    return task;
  }

  /**
   * Update a task
   */
  async update(id: string, updateTaskDto: UpdateTaskDto, user: AuthUser): Promise<Task> {
    const task = await this.findOne(id, user);

    const updateData: any = { ...updateTaskDto };

    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    Object.assign(task, updateData);

    return this.taskRepository.save(task);
  }

  /**
   * Delete a task
   */
  async remove(id: string, user: AuthUser): Promise<void> {
    const task = await this.findOne(id, user);
    
    // Only allow deleting tasks created by the user or super admin
    if (user.primaryRole !== AppRole.SUPER_ADMIN && task.createdBy !== user.id) {
      throw new ForbiddenException('You can only delete tasks you created');
    }
    
    await this.taskRepository.remove(task);
  }

  /**
   * Ensure user can access a task
   */
  private async ensureUserCanAccessTask(user: AuthUser, task: Task): Promise<void> {
    if (user.primaryRole === AppRole.SUPER_ADMIN) {
      return;
    }

    // User can access tasks they created or are assigned to
    if (task.createdBy === user.id || task.assignedTo === user.id) {
      return;
    }

    // Check school access
    if (task.schoolId) {
      // Check if user's primary school matches
      if (user.schoolId === task.schoolId) {
        return;
      }
      
      // Check if user has role for this school
      const hasRoleForSchool = user.roles?.some(role => role.schoolId === task.schoolId);
      if (hasRoleForSchool) {
        return;
      }

      // For SCHOOL_OWNER, check if they own the school
      if (user.primaryRole === AppRole.SCHOOL_OWNER) {
        const school = await this.schoolRepository.findOne({
          where: { id: task.schoolId },
          select: ['ownerId'],
        });
        if (school && school.ownerId === user.id) {
          return;
        }
      }
    }

    throw new ForbiddenException('You do not have access to this task');
  }
}







