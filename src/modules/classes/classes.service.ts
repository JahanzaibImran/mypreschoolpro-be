import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity, ClassStatus } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { EnrollmentStatus } from '../enrollment/entities/enrollment.entity';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    @InjectRepository(ClassEntity)
    private readonly classRepository: Repository<ClassEntity>,
    @Inject(forwardRef(() => EnrollmentService))
    private readonly enrollmentService: EnrollmentService,
  ) {}

  /**
   * Create a new class
   */
  async create(createClassDto: CreateClassDto): Promise<ClassEntity> {
    this.logger.log(`Creating class for school: ${createClassDto.schoolId}`);

    // Convert date strings to Date objects
    const classData: Partial<ClassEntity> = {
      schoolId: createClassDto.schoolId,
      name: createClassDto.name,
      teacherId: createClassDto.teacherId ?? null,
      program: createClassDto.program ?? null,
      startDate: createClassDto.startDate ? new Date(createClassDto.startDate) : null,
      endDate: createClassDto.endDate ? new Date(createClassDto.endDate) : null,
      capacity: createClassDto.capacity ?? 20,
      currentEnrollment: 0,
      ageGroup: createClassDto.ageGroup ?? null,
      description: createClassDto.description ?? null,
      status: createClassDto.status ?? ClassStatus.OPEN,
    };

    const classEntity = this.classRepository.create(classData);
    const saveResult = await this.classRepository.save(classEntity);
    
    // TypeORM save() can return array or single entity, ensure we have a single entity
    const savedClass = Array.isArray(saveResult) ? saveResult[0] : saveResult;

    if (!savedClass || !savedClass.id) {
      throw new BadRequestException('Failed to create class');
    }

    return savedClass;
  }

  /**
   * Find all classes with optional filtering
   */
  async findAll(options?: {
    schoolId?: string;
    status?: ClassStatus;
    teacherId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ClassEntity[]; total: number }> {
    const {
      schoolId,
      status,
      teacherId,
      limit = 100,
      offset = 0,
    } = options || {};

    const queryBuilder = this.classRepository.createQueryBuilder('class');

    if (schoolId) {
      queryBuilder.where('class.school_id = :schoolId', { schoolId });
    }

    if (status) {
      queryBuilder.andWhere('class.status = :status', { status });
    }

    if (teacherId) {
      queryBuilder.andWhere('class.teacher_id = :teacherId', { teacherId });
    }

    queryBuilder
      .orderBy('class.created_at', 'DESC')
      .skip(offset)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Find a class by ID
   */
  async findOne(id: string): Promise<ClassEntity> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['school'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID "${id}" not found`);
    }

    return classEntity;
  }

  /**
   * Find classes by school ID
   */
  async findBySchool(schoolId: string, options?: {
    status?: ClassStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ClassEntity[]; total: number }> {
    return this.findAll({
      schoolId,
      ...options,
    });
  }

  /**
   * Find classes by teacher ID
   */
  async findByTeacher(
    teacherId: string,
    options?: {
      schoolId?: string;
      status?: ClassStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ data: ClassEntity[]; total: number }> {
    return this.findAll({
      teacherId,
      schoolId: options?.schoolId,
      status: options?.status,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Find active classes
   */
  async findActive(schoolId?: string): Promise<ClassEntity[]> {
    const queryBuilder = this.classRepository.createQueryBuilder('class');

    queryBuilder.where('class.status = :status', { status: ClassStatus.OPEN });

    if (schoolId) {
      queryBuilder.andWhere('class.school_id = :schoolId', { schoolId });
    }

    queryBuilder.orderBy('class.name', 'ASC');

    return queryBuilder.getMany();
  }

  /**
   * Update a class
   */
  async update(id: string, updateClassDto: UpdateClassDto): Promise<ClassEntity> {
    this.logger.log(`Updating class: ${id}`);

    const classEntity = await this.findOne(id);

    // Convert date strings to Date objects if provided
    const updateData: any = { ...updateClassDto };
    if (updateClassDto.startDate !== undefined) {
      updateData.startDate = updateClassDto.startDate ? new Date(updateClassDto.startDate) : null;
    }
    if (updateClassDto.endDate !== undefined) {
      updateData.endDate = updateClassDto.endDate ? new Date(updateClassDto.endDate) : null;
    }

    Object.assign(classEntity, updateData);
    return this.classRepository.save(classEntity);
  }

  /**
   * Update class status
   */
  async updateStatus(id: string, status: ClassStatus): Promise<ClassEntity> {
    this.logger.log(`Updating class ${id} status to ${status}`);

    const classEntity = await this.findOne(id);
    classEntity.status = status;
    return this.classRepository.save(classEntity);
  }

  /**
   * Update class enrollment count
   */
  async updateEnrollmentCount(id: string): Promise<ClassEntity> {
    const classEntity = await this.findOne(id);

    // Count active enrollments for this class

    const enrollments = await this.enrollmentService.findAll({
      classId: id,
      status: EnrollmentStatus.ACTIVE,
      limit: 1000, // Get all enrollments
    });

    classEntity.currentEnrollment = enrollments.total;
    return this.classRepository.save(classEntity);
  }

  /**
   * Check if class has available spots
   */
  async hasAvailableSpots(id: string): Promise<boolean> {
    const classEntity = await this.findOne(id);
    if (classEntity.capacity == null) {
      return true;
    }
    const current = classEntity.currentEnrollment ?? 0;
    return current < classEntity.capacity;
  }

  /**
   * Assign teacher to class
   */
  async assignTeacher(id: string, teacherId: string): Promise<ClassEntity> {
    this.logger.log(`Assigning teacher ${teacherId} to class ${id}`);

    const classEntity = await this.findOne(id);
    classEntity.teacherId = teacherId;
    return this.classRepository.save(classEntity);
  }

  /**
   * Delete a class
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting class: ${id}`);

    const classEntity = await this.findOne(id);
    await this.classRepository.remove(classEntity);
  }

  /**
   * Check if a class exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.classRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Get class statistics for a school
   */
  async getStatistics(schoolId: string): Promise<{
    total: number;
    byStatus: Record<ClassStatus, number>;
    openClasses: number;
    totalCapacity: number;
    totalEnrolled: number;
    utilizationRate: number;
  }> {
    const classes = await this.classRepository.find({
      where: { schoolId },
    });

    const byStatus: Record<ClassStatus, number> = {
      [ClassStatus.OPEN]: 0,
      [ClassStatus.CLOSED]: 0,
      [ClassStatus.FULL]: 0,
    };

    let openClasses = 0;
    let totalCapacity = 0;
    let totalEnrolled = 0;

    classes.forEach((classEntity) => {
      byStatus[classEntity.status] = (byStatus[classEntity.status] || 0) + 1;
      const capacity = classEntity.capacity ?? 0;
      const enrolled = classEntity.currentEnrollment ?? 0;
      if (classEntity.status === ClassStatus.OPEN) {
        openClasses++;
        totalCapacity += capacity;
        totalEnrolled += enrolled;
      }
    });

    const utilizationRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

    return {
      total: classes.length,
      byStatus,
      openClasses,
      totalCapacity,
      totalEnrolled,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    };
  }

  /**
   * Get capacity aggregated by program for a school
   */
  async getCapacityByProgram(schoolId: string): Promise<
    Record<string, { capacity: number; enrolled: number; available: number }>
  > {
    const classes = await this.classRepository.find({
      where: { schoolId },
      select: ['program', 'capacity', 'currentEnrollment'],
    });

    const capacityByProgram: Record<string, { capacity: number; enrolled: number; available: number }> = {};
    classes.forEach((cls) => {
      const prog = cls.program || 'Unknown';
      if (!capacityByProgram[prog]) {
        capacityByProgram[prog] = { capacity: 0, enrolled: 0, available: 0 };
      }
      capacityByProgram[prog].capacity += cls.capacity || 0;
      capacityByProgram[prog].enrolled += cls.currentEnrollment || 0;
    });

    Object.keys(capacityByProgram).forEach((prog) => {
      capacityByProgram[prog].available = Math.max(
        0,
        capacityByProgram[prog].capacity - capacityByProgram[prog].enrolled,
      );
    });

    return capacityByProgram;
  }
}

