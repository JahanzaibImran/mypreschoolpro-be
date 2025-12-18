import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CalendarEvent, CalendarEventType } from './entities/calendar-event.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEventResponseDto } from './dto/calendar-event-response.dto';
import { EnrollmentEntity, EnrollmentStatus } from '../enrollment/entities/enrollment.entity';
import { AppRole } from '../../common/enums/app-role.enum';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarRepository: Repository<CalendarEvent>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
  ) {}

  /**
   * Create a new calendar event
   */
  async createEvent(
    dto: CreateCalendarEventDto,
    userId: string,
    userRoles: AppRole[],
    schoolId: string,
  ): Promise<CalendarEventResponseDto> {
    // Verify user has permission
    const hasPermission = userRoles.some((role) =>
      [AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.ADMISSIONS_STAFF].includes(role),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to create calendar events');
    }

    // Verify school matches
    if (dto.schoolId !== schoolId) {
      throw new ForbiddenException('You can only create events for your own school');
    }

    // If classId is provided, verify it belongs to the school
    if (dto.classId) {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { classId: dto.classId, schoolId },
      });

      if (!enrollment) {
        throw new BadRequestException('Class does not belong to this school');
      }
    }

    const event = this.calendarRepository.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isSchoolWide: !dto.classId,
      createdBy: userId,
    });

    const savedEvent = await this.calendarRepository.save(event);
    return this.mapToResponseDto(savedEvent);
  }

  /**
   * Get calendar events with filters
   */
  async getEvents(
    schoolId: string,
    classId: string | undefined,
    startDate: string | undefined,
    endDate: string | undefined,
    userId: string,
    userRole: AppRole,
  ): Promise<CalendarEventResponseDto[]> {
    const queryBuilder = this.calendarRepository
      .createQueryBuilder('event')
      .where('event.schoolId = :schoolId', { schoolId });

    // For parents, filter by their children's classes
    if (userRole === AppRole.PARENT) {
      const enrollments = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .innerJoin('parent_students', 'ps', 'ps.student_id = enrollment.lead_id')
        .where('ps.parent_id = :userId', { userId })
        .andWhere('enrollment.school_id = :schoolId', { schoolId })
        .andWhere('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
        .getMany();

      const classIds = enrollments.map((e) => e.classId).filter(Boolean) as string[];

      // Parents can see school-wide events OR events for their children's classes
      if (classIds.length > 0) {
        if (classId) {
          // If specific classId requested, verify parent has access
          if (!classIds.includes(classId)) {
            return []; // Parent doesn't have access to this class
          }
          queryBuilder.andWhere('(event.classId = :classId OR event.classId IS NULL)', { classId });
        } else {
          // Show all events for parent's classes plus school-wide events
          queryBuilder.andWhere('(event.classId IS NULL OR event.classId IN (:...classIds))', {
            classIds,
          });
        }
      } else {
        // No enrollments, can only see school-wide events
        queryBuilder.andWhere('event.classId IS NULL');
      }
    } else if (classId) {
      // Staff filtering by specific class (can also see school-wide events)
      queryBuilder.andWhere('(event.classId = :classId OR event.classId IS NULL)', { classId });
    }

    if (startDate) {
      queryBuilder.andWhere('event.startDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('(event.endDate IS NULL OR event.endDate <= :endDate)', { endDate });
    }

    const events = await queryBuilder
      .orderBy('event.startDate', 'ASC')
      .addOrderBy('event.startTime', 'ASC')
      .getMany();

    return events.map((event) => this.mapToResponseDto(event));
  }

  /**
   * Get calendar event by ID
   */
  async getEventById(id: string, userId: string, userRole: AppRole): Promise<CalendarEventResponseDto> {
    const event = await this.calendarRepository.findOne({
      where: { id },
      relations: ['school', 'class', 'creator'],
    });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    // Verify access
    if (userRole === AppRole.PARENT) {
      const enrollment = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .innerJoin('parent_students', 'ps', 'ps.student_id = enrollment.lead_id')
        .where('ps.parent_id = :userId', { userId })
        .andWhere('enrollment.school_id = :schoolId', { schoolId: event.schoolId })
        .andWhere('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
        .andWhere(
          '(enrollment.class_id = :classId OR :classId IS NULL)',
          { classId: event.classId },
        )
        .getOne();

      if (!enrollment) {
        throw new ForbiddenException('You do not have access to this calendar event');
      }
    }

    return this.mapToResponseDto(event);
  }

  /**
   * Update calendar event
   */
  async updateEvent(
    id: string,
    dto: UpdateCalendarEventDto,
    userId: string,
    userRoles: AppRole[],
    schoolId: string,
  ): Promise<CalendarEventResponseDto> {
    const event = await this.calendarRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    // Verify permissions
    const hasPermission = userRoles.some((role) =>
      [AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.ADMISSIONS_STAFF].includes(role),
    );

    if (!hasPermission && event.createdBy !== userId) {
      throw new ForbiddenException('You can only update events you created');
    }

    if (event.schoolId !== schoolId) {
      throw new ForbiddenException('You can only update events for your own school');
    }

    // Update fields
    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.startDate !== undefined) event.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) event.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.startTime !== undefined) event.startTime = dto.startTime || null;
    if (dto.endTime !== undefined) event.endTime = dto.endTime || null;
    if (dto.eventType !== undefined) event.eventType = dto.eventType;
    if (dto.location !== undefined) event.location = dto.location || null;
    if (dto.isAllDay !== undefined) event.isAllDay = dto.isAllDay;
    if (dto.classId !== undefined) {
      event.classId = dto.classId || null;
      event.isSchoolWide = !dto.classId;
    }

    const updatedEvent = await this.calendarRepository.save(event);
    return this.mapToResponseDto(updatedEvent);
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(id: string, userId: string, userRoles: AppRole[], schoolId: string): Promise<void> {
    const event = await this.calendarRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    // Verify permissions
    const hasPermission = userRoles.some((role) =>
      [AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.ADMISSIONS_STAFF].includes(role),
    );

    if (!hasPermission && event.createdBy !== userId) {
      throw new ForbiddenException('You can only delete events you created');
    }

    if (event.schoolId !== schoolId) {
      throw new ForbiddenException('You can only delete events for your own school');
    }

    await this.calendarRepository.remove(event);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(event: CalendarEvent): CalendarEventResponseDto {
    return {
      id: event.id,
      schoolId: event.schoolId,
      classId: event.classId,
      title: event.title,
      description: event.description,
      startDate: event.startDate instanceof Date
        ? event.startDate.toISOString().split('T')[0]
        : event.startDate,
      endDate: event.endDate
        ? event.endDate instanceof Date
          ? event.endDate.toISOString().split('T')[0]
          : event.endDate
        : null,
      startTime: event.startTime,
      endTime: event.endTime,
      eventType: event.eventType,
      location: event.location,
      isAllDay: event.isAllDay,
      isSchoolWide: event.isSchoolWide,
      createdBy: event.createdBy,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}

