import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { IncidentReport, IncidentStatus } from './entities/incident-report.entity';
import { Student } from '../students/entities/student.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { AddFollowUpDto } from './dto/add-follow-up.dto';
import { IncidentFilterDto } from './dto/incident-filter.dto';
import { CommunicationsService } from '../communications/communications.service';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(IncidentReport)
    private readonly incidentRepository: Repository<IncidentReport>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
    private readonly communicationsService: CommunicationsService,
  ) {}

  /**
   * Create a new incident report
   */
  async createIncident(
    dto: CreateIncidentDto,
    userId: string,
    userRoles: AppRole[],
    schoolId: string,
  ): Promise<IncidentReport> {
    // First, try to find student by ID only
    let student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
      relations: ['school'],
    });

    // If not found, provide a more helpful error
    if (!student) {
      throw new NotFoundException(
        `Student with ID ${dto.studentId} not found. Please ensure the student is enrolled.`,
      );
    }

    // Verify student belongs to the user's school
    if (student.schoolId !== schoolId) {
      throw new ForbiddenException(
        `Student does not belong to your school. Student belongs to school ${student.schoolId}, but you are associated with school ${schoolId}`,
      );
    }

    // Verify user has permission (teacher, admin, or owner)
    const hasPermission = userRoles.some((role) =>
      [AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER].includes(role),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to create incident reports');
    }

    const incident = this.incidentRepository.create({
      studentId: dto.studentId,
      reportedBy: userId,
      schoolId,
      incidentDate: new Date(dto.incidentDate),
      location: dto.location,
      type: dto.type,
      severity: dto.severity,
      description: dto.description,
      actionTaken: dto.actionTaken || null,
      witnesses: dto.witnesses || [],
      photoUrls: dto.photoUrls || [],
      status: IncidentStatus.OPEN,
    });

    const savedIncident = await this.incidentRepository.save(incident);

    // Send notification to parent
    await this.sendIncidentNotification(savedIncident, student);

    return savedIncident;
  }

  /**
   * Get incidents with filters
   */
  async getIncidents(
    filters: IncidentFilterDto,
    userId: string,
    userRoles: AppRole[],
  ): Promise<IncidentReport[]> {
    const where: FindOptionsWhere<IncidentReport> = {};

    // Apply filters
    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.schoolId) {
      where.schoolId = filters.schoolId;
    } else {
      // If no schoolId filter, get user's school
      const userProfile = await this.profileRepository.findOne({
        where: { id: userId },
        relations: ['roles'],
      });

      if (userProfile?.roles && userProfile.roles.length > 0) {
        const schoolRole = userProfile.roles.find(
          (r) => r.schoolId !== null && r.role !== AppRole.SUPER_ADMIN,
        );
        if (schoolRole?.schoolId) {
          where.schoolId = schoolRole.schoolId;
        }
      }
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const queryBuilder = this.incidentRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.student', 'student')
      .leftJoinAndSelect('incident.reportedByUser', 'reportedByUser')
      .leftJoinAndSelect('incident.school', 'school')
      .where(where);

    // Date range filter
    if (filters.startDate || filters.endDate) {
      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('incident.incidentDate BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate,
        });
      } else if (filters.startDate) {
        queryBuilder.andWhere('incident.incidentDate >= :startDate', {
          startDate: filters.startDate,
        });
      } else if (filters.endDate) {
        queryBuilder.andWhere('incident.incidentDate <= :endDate', {
          endDate: filters.endDate,
        });
      }
    }

    // If parent, only show their children's incidents
    if (userRoles.includes(AppRole.PARENT) && !userRoles.includes(AppRole.SCHOOL_ADMIN)) {
      queryBuilder
        .innerJoin('parent_students', 'ps', 'ps.student_id = incident.student_id')
        .andWhere('ps.parent_id = :userId', { userId });
    }

    return queryBuilder.orderBy('incident.incidentDate', 'DESC').getMany();
  }

  /**
   * Get incident by ID
   */
  async getIncidentById(id: string, userId: string, userRoles: AppRole[]): Promise<IncidentReport> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: ['student', 'reportedByUser', 'school'],
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    // Verify access
    if (userRoles.includes(AppRole.PARENT)) {
      // Check if parent has access to this student
      const parentStudent = await this.profileRepository
        .createQueryBuilder('profile')
        .innerJoin('parent_students', 'ps', 'ps.parent_id = profile.id')
        .where('profile.id = :userId', { userId })
        .andWhere('ps.student_id = :studentId', { studentId: incident.studentId })
        .getOne();

      if (!parentStudent) {
        throw new ForbiddenException('You do not have access to this incident');
      }
    } else {
      // Verify school access for staff
      const userProfile = await this.profileRepository.findOne({
        where: { id: userId },
        relations: ['roles'],
      });

      const hasAccess = userProfile?.roles.some(
        (r) =>
          r.schoolId === incident.schoolId &&
          [AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER].includes(r.role),
      );

      if (!hasAccess && !userRoles.includes(AppRole.SUPER_ADMIN)) {
        throw new ForbiddenException('You do not have access to this incident');
      }
    }

    return incident;
  }

  /**
   * Update incident
   */
  async updateIncident(
    id: string,
    dto: UpdateIncidentDto,
    userId: string,
    userRoles: AppRole[],
  ): Promise<IncidentReport> {
    const incident = await this.getIncidentById(id, userId, userRoles);

    // Only staff can update (not parents)
    const canUpdate = userRoles.some((role) =>
      [AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SUPER_ADMIN].includes(
        role,
      ),
    );

    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update incidents');
    }

    // Update fields
    if (dto.incidentDate) {
      incident.incidentDate = new Date(dto.incidentDate);
    }
    if (dto.location !== undefined) {
      incident.location = dto.location;
    }
    if (dto.description !== undefined) {
      incident.description = dto.description;
    }
    if (dto.actionTaken !== undefined) {
      incident.actionTaken = dto.actionTaken;
    }
    if (dto.witnesses !== undefined) {
      incident.witnesses = dto.witnesses;
    }
    if (dto.photoUrls !== undefined) {
      incident.photoUrls = dto.photoUrls;
    }
    if (dto.status !== undefined) {
      incident.status = dto.status;
    }
    if (dto.parentAcknowledged !== undefined) {
      incident.parentAcknowledged = dto.parentAcknowledged;
      if (dto.parentAcknowledged) {
        incident.parentAcknowledgedAt = new Date();
      }
    }

    return this.incidentRepository.save(incident);
  }

  /**
   * Add follow-up note to incident
   */
  async addFollowUp(
    id: string,
    dto: AddFollowUpDto,
    userId: string,
    userRoles: AppRole[],
  ): Promise<IncidentReport> {
    const incident = await this.getIncidentById(id, userId, userRoles);

    // Only staff can add follow-ups
    const canAddFollowUp = userRoles.some((role) =>
      [AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SUPER_ADMIN].includes(
        role,
      ),
    );

    if (!canAddFollowUp) {
      throw new ForbiddenException('You do not have permission to add follow-up notes');
    }

    const followUpNotes = incident.followUpNotes || [];
    followUpNotes.push({
      date: new Date(),
      note: dto.note,
      authorId: userId,
    });

    incident.followUpNotes = followUpNotes;

    // If adding follow-up, mark as follow-up required if not resolved
    if (incident.status === IncidentStatus.OPEN) {
      incident.status = IncidentStatus.FOLLOW_UP_REQUIRED;
    }

    return this.incidentRepository.save(incident);
  }

  /**
   * Send notification to parent about incident
   */
  private async sendIncidentNotification(
    incident: IncidentReport,
    student: Student,
  ): Promise<void> {
    try {
      if (!student.parentEmail) {
        this.logger.warn(`No parent email for student ${student.id}`);
        return;
      }

      const parentProfile = await this.profileRepository.findOne({
        where: { email: student.parentEmail },
        select: ['id'],
      });

      if (!parentProfile) {
        this.logger.warn(`Parent profile not found for email ${student.parentEmail}`);
        return;
      }

      const reportedByUser = await this.profileRepository.findOne({
        where: { id: incident.reportedBy },
        select: ['firstName', 'lastName'],
      });

      const reportedByName = reportedByUser
        ? `${reportedByUser.firstName || ''} ${reportedByUser.lastName || ''}`.trim()
        : 'Staff member';

      const severityLabels = {
        minor: 'Minor',
        moderate: 'Moderate',
        major: 'Major',
      };

      const typeLabels = {
        fall: 'Fall',
        injury: 'Injury',
        altercation: 'Altercation',
        medical_emergency: 'Medical Emergency',
        allergic_reaction: 'Allergic Reaction',
        other: 'Other',
      };

      await this.communicationsService.sendParentMessage(incident.reportedBy, {
        recipientId: parentProfile.id,
        studentId: student.id,
        subject: `Incident Report: ${typeLabels[incident.type]} - ${severityLabels[incident.severity]} Severity`,
        content: `An incident involving ${student.firstName} ${student.lastName} occurred on ${incident.incidentDate.toLocaleString()}.\n\n` +
          `Type: ${typeLabels[incident.type]}\n` +
          `Severity: ${severityLabels[incident.severity]}\n` +
          `Location: ${incident.location}\n` +
          `Reported by: ${reportedByName}\n\n` +
          `Description: ${incident.description}\n\n` +
          (incident.actionTaken ? `Action Taken: ${incident.actionTaken}\n\n` : '') +
          `Please log in to view the full incident report and acknowledge receipt.`,
        channel: 'email',
        messageType: 'incident_report' as any,
      });

      // Update incident as notified
      incident.parentNotified = true;
      await this.incidentRepository.save(incident);

      this.logger.log(`Incident notification sent to ${student.parentEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send incident notification: ${error.message}`, error.stack);
      // Don't fail the request if notification fails
    }
  }
}


