import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { IllnessLog } from './entities/illness-log.entity';
import { Student } from '../students/entities/student.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { CreateIllnessLogDto } from './dto/create-illness-log.dto';
import { CommunicationsService } from '../communications/communications.service';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectRepository(IllnessLog)
    private readonly illnessLogRepository: Repository<IllnessLog>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
    private readonly communicationsService: CommunicationsService,
  ) {}

  /**
   * Create an illness log
   */
  async createIllnessLog(
    dto: CreateIllnessLogDto,
    userId: string,
    userRoles: AppRole[],
    schoolId: string,
  ): Promise<IllnessLog> {
    // Verify student exists and belongs to school
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId, schoolId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify user has permission (teacher, admin, owner, or parent of the student)
    const isParent = await this.verifyParentAccess(userId, dto.studentId);
    const hasStaffPermission = userRoles.some((role) =>
      [AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER].includes(role),
    );

    if (!isParent && !hasStaffPermission) {
      throw new ForbiddenException('You do not have permission to create illness logs');
    }

    const illnessLog = this.illnessLogRepository.create({
      studentId: dto.studentId,
      reportedBy: userId,
      schoolId,
      illnessDate: new Date(dto.illnessDate),
      symptoms: dto.symptoms,
      temperature: dto.temperature || null,
      notes: dto.notes || null,
      pickupRecommended: dto.pickupRecommended || false,
      doctorNoteUrl: dto.doctorNoteUrl || null,
    });

    const savedLog = await this.illnessLogRepository.save(illnessLog);

    // Send notification if reported by staff
    if (hasStaffPermission) {
      await this.sendIllnessNotification(savedLog, student);
    }

    return savedLog;
  }

  /**
   * Get illness logs with filters
   */
  async getIllnessLogs(
    studentId: string | undefined,
    schoolId: string | undefined,
    userId: string,
    userRoles: AppRole[],
  ): Promise<IllnessLog[]> {
    const where: FindOptionsWhere<IllnessLog> = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (schoolId) {
      where.schoolId = schoolId;
    } else {
      // Get user's school
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

    const queryBuilder = this.illnessLogRepository
      .createQueryBuilder('illness')
      .leftJoinAndSelect('illness.student', 'student')
      .leftJoinAndSelect('illness.reportedByUser', 'reportedByUser')
      .leftJoinAndSelect('illness.school', 'school')
      .where(where);

    // If parent, only show their children's logs
    if (userRoles.includes(AppRole.PARENT) && !userRoles.includes(AppRole.SCHOOL_ADMIN)) {
      queryBuilder
        .innerJoin('parent_students', 'ps', 'ps.student_id = illness.student_id')
        .andWhere('ps.parent_id = :userId', { userId });
    }

    return queryBuilder.orderBy('illness.illnessDate', 'DESC').getMany();
  }

  /**
   * Get illness log by ID
   */
  async getIllnessLogById(
    id: string,
    userId: string,
    userRoles: AppRole[],
  ): Promise<IllnessLog> {
    const log = await this.illnessLogRepository.findOne({
      where: { id },
      relations: ['student', 'reportedByUser', 'school'],
    });

    if (!log) {
      throw new NotFoundException('Illness log not found');
    }

    // Verify access
    if (userRoles.includes(AppRole.PARENT)) {
      const parentStudent = await this.profileRepository
        .createQueryBuilder('profile')
        .innerJoin('parent_students', 'ps', 'ps.parent_id = profile.id')
        .where('profile.id = :userId', { userId })
        .andWhere('ps.student_id = :studentId', { studentId: log.studentId })
        .getOne();

      if (!parentStudent) {
        throw new ForbiddenException('You do not have access to this illness log');
      }
    } else {
      const userProfile = await this.profileRepository.findOne({
        where: { id: userId },
        relations: ['roles'],
      });

      const hasAccess = userProfile?.roles.some(
        (r) =>
          r.schoolId === log.schoolId &&
          [AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER].includes(r.role),
      );

      if (!hasAccess && !userRoles.includes(AppRole.SUPER_ADMIN)) {
        throw new ForbiddenException('You do not have access to this illness log');
      }
    }

    return log;
  }

  /**
   * Verify parent access to student
   */
  private async verifyParentAccess(parentId: string, studentId: string): Promise<boolean> {
    const parentStudent = await this.profileRepository
      .createQueryBuilder('profile')
      .innerJoin('parent_students', 'ps', 'ps.parent_id = profile.id')
      .where('profile.id = :parentId', { parentId })
      .andWhere('ps.student_id = :studentId', { studentId })
      .getOne();

    return !!parentStudent;
  }

  /**
   * Send notification to parent about illness
   */
  private async sendIllnessNotification(illnessLog: IllnessLog, student: Student): Promise<void> {
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
        where: { id: illnessLog.reportedBy },
        select: ['firstName', 'lastName'],
      });

      const reportedByName = reportedByUser
        ? `${reportedByUser.firstName || ''} ${reportedByUser.lastName || ''}`.trim()
        : 'Staff member';

      let message = `${student.firstName} ${student.lastName} has been logged as showing signs of illness on ${illnessLog.illnessDate.toLocaleString()}.\n\n`;
      message += `Symptoms: ${illnessLog.symptoms.join(', ')}\n`;

      if (illnessLog.temperature) {
        message += `Temperature: ${illnessLog.temperature}°F\n`;
      }

      if (illnessLog.notes) {
        message += `Notes: ${illnessLog.notes}\n`;
      }

      if (illnessLog.pickupRecommended) {
        message += `\n⚠️ PICKUP RECOMMENDED: Please arrange to pick up your child as soon as possible.`;
      }

      message += `\n\nReported by: ${reportedByName}`;

      await this.communicationsService.sendParentMessage(illnessLog.reportedBy, {
        recipientId: parentProfile.id,
        studentId: student.id,
        subject: `Illness Log: ${student.firstName} ${student.lastName}`,
        content: message,
        channel: 'email',
        messageType: 'illness_log' as any,
      });

      // Update log as notified
      illnessLog.parentNotified = true;
      await this.illnessLogRepository.save(illnessLog);

      this.logger.log(`Illness notification sent to ${student.parentEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send illness notification: ${error.message}`, error.stack);
      // Don't fail the request if notification fails
    }
  }
}


