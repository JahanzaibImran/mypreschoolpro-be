import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckInOutRecord } from './entities/check-in-out-record.entity';
import { AuthorizedPickupPerson } from './entities/authorized-pickup-person.entity';
import { ParentStudent } from './entities/parent-student.entity';
import { Student } from '../students/entities/student.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { LeadEntity } from '../leads/entities/lead.entity';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { CheckInOutResponseDto } from './dto/check-in-out-response.dto';
import { CommunicationsService } from '../communications/communications.service';
import { AppRole } from '../../common/enums/app-role.enum';

@Injectable()
export class CheckInOutService {
  private readonly logger = new Logger(CheckInOutService.name);

  constructor(
    @InjectRepository(CheckInOutRecord)
    private readonly checkInOutRepository: Repository<CheckInOutRecord>,
    @InjectRepository(AuthorizedPickupPerson)
    private readonly authorizedPickupRepository: Repository<AuthorizedPickupPerson>,
    @InjectRepository(ParentStudent)
    private readonly parentStudentRepository: Repository<ParentStudent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    private readonly communicationsService: CommunicationsService,
  ) {}

  /**
   * Check in a student
   */
  async checkIn(dto: CheckInDto, userId: string): Promise<CheckInOutResponseDto> {
    // 1. Resolve student ID (could be lead ID or student ID)
    let studentId = dto.studentId;
    let student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });

    // If not found as student, try to find via lead
    if (!student) {
      const lead = await this.leadRepository.findOne({
        where: { id: studentId },
        select: ['id', 'childName', 'parentEmail', 'schoolId'],
      });

      if (lead) {
        // Find student by parent email and child name
        const parentProfile = await this.profileRepository.findOne({
          where: { id: userId },
          select: ['email'],
        });

        if (parentProfile?.email) {
          const [firstName] = lead.childName.trim().split(/\s+/);
          student = await this.studentRepository
            .createQueryBuilder('student')
            .where('LOWER(student.parentEmail) = LOWER(:email)', { email: parentProfile.email })
            .andWhere('LOWER(student.firstName) = LOWER(:firstName)', { firstName })
            .andWhere('student.schoolId = :schoolId', { schoolId: lead.schoolId })
            .leftJoinAndSelect('student.school', 'school')
            .orderBy('student.createdAt', 'DESC')
            .getOne();

          if (student) {
            studentId = student.id;
          }
        }
      }
    }

    if (!student) {
      throw new NotFoundException('Student not found. Please ensure the child is enrolled.');
    }

    // 2. Verify user has permission (parent or authorized pickup person)
    const isParent = await this.verifyParentAccess(userId, studentId);
    let isAuthorizedPickup = false;

    if (!isParent && dto.isAuthorizedPickup && dto.authorizedPickupId) {
      isAuthorizedPickup = await this.verifyAuthorizedPickup(
        dto.authorizedPickupId,
        studentId,
      );
      if (!isAuthorizedPickup) {
        throw new ForbiddenException('You are not authorized to check in this student');
      }
    } else if (!isParent) {
      throw new ForbiddenException('You are not authorized to check in this student');
    }

    // 3. Verify geofencing
    const isWithinGeofence = await this.verifyGeofence(dto.location, student.schoolId);
    if (!isWithinGeofence) {
      throw new BadRequestException('You must be on school premises to check in');
    }

    // 4. Check if student is already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await this.checkInOutRepository
      .createQueryBuilder('record')
      .where('record.studentId = :studentId', { studentId })
      .andWhere('record.checkInTime >= :today', { today })
      .andWhere('record.checkInTime < :tomorrow', { tomorrow })
      .andWhere('record.checkOutTime IS NULL')
      .getOne();

    if (existingCheckIn) {
      throw new BadRequestException('Student is already checked in');
    }

    // 5. Create check-in record
    const checkInRecord = this.checkInOutRepository.create({
      studentId: studentId,
      checkedInBy: userId,
      checkInTime: new Date(),
      checkInSignature: dto.signature,
      checkInLocation: dto.location,
      schoolId: student.schoolId,
      notes: dto.notes || null,
    });

    const savedRecord = await this.checkInOutRepository.save(checkInRecord);

    // 6. Send notification to parent
    await this.sendCheckInNotification(savedRecord, student);

    // 7. Return response
    const checkedInByUser = await this.profileRepository.findOne({
      where: { id: userId },
      select: ['id', 'firstName', 'lastName'],
    });

    return {
      id: savedRecord.id,
      studentId: savedRecord.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      checkedInBy: savedRecord.checkedInBy,
      checkedInByName: checkedInByUser
        ? `${checkedInByUser.firstName || ''} ${checkedInByUser.lastName || ''}`.trim()
        : 'Unknown',
      checkInTime: savedRecord.checkInTime,
      checkOutTime: savedRecord.checkOutTime,
      checkInVerified: savedRecord.checkInVerified,
      checkOutVerified: savedRecord.checkOutVerified,
      schoolId: savedRecord.schoolId,
    };
  }

  /**
   * Check out a student
   */
  async checkOut(dto: CheckOutDto, userId: string): Promise<CheckInOutResponseDto> {
    // 1. Find check-in record
    const checkInRecord = await this.checkInOutRepository.findOne({
      where: { id: dto.checkInRecordId },
      relations: ['student', 'student.school'],
    });

    if (!checkInRecord) {
      throw new NotFoundException('Check-in record not found');
    }

    if (checkInRecord.checkOutTime) {
      throw new BadRequestException('Student is already checked out');
    }

    // 2. Verify user has permission
    const isParent = await this.verifyParentAccess(userId, checkInRecord.studentId);
    if (!isParent) {
      // Check if user is authorized pickup person
      const authorizedPickup = await this.authorizedPickupRepository.findOne({
        where: {
          studentId: checkInRecord.studentId,
          parentId: userId,
          isActive: true,
        },
      });

      if (!authorizedPickup) {
        throw new ForbiddenException('You are not authorized to check out this student');
      }
    }

    // 3. Verify geofencing
    const isWithinGeofence = await this.verifyGeofence(
      dto.location,
      checkInRecord.student.schoolId,
    );
    if (!isWithinGeofence) {
      throw new BadRequestException('You must be on school premises to check out');
    }

    // 4. Update check-out record
    checkInRecord.checkOutTime = new Date();
    checkInRecord.checkOutSignature = dto.signature;
    checkInRecord.checkOutLocation = dto.location;
    if (dto.notes) {
      checkInRecord.notes = checkInRecord.notes
        ? `${checkInRecord.notes}\n\nCheck-out: ${dto.notes}`
        : dto.notes;
    }

    const savedRecord = await this.checkInOutRepository.save(checkInRecord);

    // 5. Send notification to parent
    await this.sendCheckOutNotification(savedRecord, checkInRecord.student);

    // 6. Return response
    const checkedInByUser = await this.profileRepository.findOne({
      where: { id: savedRecord.checkedInBy },
      select: ['id', 'firstName', 'lastName'],
    });

    return {
      id: savedRecord.id,
      studentId: savedRecord.studentId,
      studentName: `${checkInRecord.student.firstName} ${checkInRecord.student.lastName}`,
      checkedInBy: savedRecord.checkedInBy,
      checkedInByName: checkedInByUser
        ? `${checkedInByUser.firstName || ''} ${checkedInByUser.lastName || ''}`.trim()
        : 'Unknown',
      checkInTime: savedRecord.checkInTime,
      checkOutTime: savedRecord.checkOutTime,
      checkInVerified: savedRecord.checkInVerified,
      checkOutVerified: savedRecord.checkOutVerified,
      schoolId: savedRecord.schoolId,
    };
  }

  /**
   * Get check-in/out records for a student
   */
  async getRecordsByStudent(
    studentIdOrLeadId: string,
    userId: string,
    limit = 50,
  ): Promise<CheckInOutResponseDto[]> {
    // Resolve student ID (could be lead ID or student ID)
    let studentId = studentIdOrLeadId;
    let student = await this.studentRepository.findOne({
      where: { id: studentId },
      select: ['id'],
    });

    // If not found as student, try to find via lead
    if (!student) {
      const lead = await this.leadRepository.findOne({
        where: { id: studentId },
        select: ['id', 'childName', 'parentEmail', 'schoolId'],
      });

      if (lead) {
        const parentProfile = await this.profileRepository.findOne({
          where: { id: userId },
          select: ['email'],
        });

        if (parentProfile?.email) {
          const [firstName] = lead.childName.trim().split(/\s+/);
          student = await this.studentRepository
            .createQueryBuilder('student')
            .where('LOWER(student.parentEmail) = LOWER(:email)', { email: parentProfile.email })
            .andWhere('LOWER(student.firstName) = LOWER(:firstName)', { firstName })
            .andWhere('student.schoolId = :schoolId', { schoolId: lead.schoolId })
            .select(['student.id'])
            .orderBy('student.createdAt', 'DESC')
            .getOne();

          if (student) {
            studentId = student.id;
          }
        }
      }
    }

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify access
    const isParent = await this.verifyParentAccess(userId, studentId);
    if (!isParent) {
      throw new ForbiddenException('You are not authorized to view these records');
    }

    const records = await this.checkInOutRepository.find({
      where: { studentId },
      order: { checkInTime: 'DESC' },
      take: limit,
      relations: ['student', 'checkedInByUser'],
    });

    return records.map((record) => ({
      id: record.id,
      studentId: record.studentId,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      checkedInBy: record.checkedInBy,
      checkedInByName: record.checkedInByUser
        ? `${record.checkedInByUser.firstName || ''} ${record.checkedInByUser.lastName || ''}`.trim()
        : 'Unknown',
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      checkInVerified: record.checkInVerified,
      checkOutVerified: record.checkOutVerified,
      schoolId: record.schoolId,
    }));
  }

  /**
   * Verify parent access to student
   */
  private async verifyParentAccess(userId: string, studentId: string): Promise<boolean> {
    const parentStudent = await this.parentStudentRepository.findOne({
      where: { parentId: userId, studentId },
    });

    if (parentStudent) {
      return true;
    }

    // Fallback: check by email if parent_students table doesn't have the relationship
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      select: ['parentEmail'],
    });

    if (!student || !student.parentEmail) {
      return false;
    }

    const profile = await this.profileRepository.findOne({
      where: { id: userId },
      select: ['email'],
    });

    return profile?.email?.toLowerCase() === student.parentEmail.toLowerCase();
  }

  /**
   * Verify authorized pickup person
   */
  private async verifyAuthorizedPickup(
    authorizedPickupId: string,
    studentId: string,
  ): Promise<boolean> {
    const authorizedPickup = await this.authorizedPickupRepository.findOne({
      where: {
        id: authorizedPickupId,
        studentId,
        isActive: true,
      },
    });

    return !!authorizedPickup;
  }

  /**
   * Verify geofencing
   */
  private async verifyGeofence(
    location: { lat: number; lng: number },
    schoolId: string,
  ): Promise<boolean> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
      select: ['geofenceRadiusMeters', 'geofenceCenter'],
    });

    if (!school) {
      return false;
    }

    // If geofence not configured, allow (for backward compatibility)
    if (!school.geofenceCenter || !school.geofenceRadiusMeters) {
      this.logger.warn(`Geofence not configured for school ${schoolId}, allowing check-in`);
      return true;
    }

    const distance = this.calculateDistance(
      location.lat,
      location.lng,
      school.geofenceCenter.lat,
      school.geofenceCenter.lng,
    );

    return distance <= school.geofenceRadiusMeters;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Send check-in notification to parent
   */
  private async sendCheckInNotification(record: CheckInOutRecord, student: Student): Promise<void> {
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

      const checkedInByUser = await this.profileRepository.findOne({
        where: { id: record.checkedInBy },
        select: ['firstName', 'lastName'],
      });

      const checkedInByName = checkedInByUser
        ? `${checkedInByUser.firstName || ''} ${checkedInByUser.lastName || ''}`.trim()
        : 'Someone';

      await this.communicationsService.sendParentMessage(
        record.checkedInBy, // System user ID - you may want to use a system account
        {
          recipientId: parentProfile.id,
          studentId: student.id,
          subject: 'Child Checked In',
          content: `${student.firstName} ${student.lastName} has been checked in by ${checkedInByName} at ${record.checkInTime.toLocaleString()}.`,
          channel: 'email',
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send check-in notification: ${error.message}`, error.stack);
      // Don't fail the check-in if notification fails
    }
  }

  /**
   * Send check-out notification to parent
   */
  private async sendCheckOutNotification(record: CheckInOutRecord, student: Student): Promise<void> {
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

      const checkedInByUser = await this.profileRepository.findOne({
        where: { id: record.checkedInBy },
        select: ['firstName', 'lastName'],
      });

      const checkedInByName = checkedInByUser
        ? `${checkedInByUser.firstName || ''} ${checkedInByUser.lastName || ''}`.trim()
        : 'Someone';

      await this.communicationsService.sendParentMessage(
        record.checkedInBy,
        {
          recipientId: parentProfile.id,
          studentId: student.id,
          subject: 'Child Checked Out',
          content: `${student.firstName} ${student.lastName} has been checked out by ${checkedInByName} at ${record.checkOutTime?.toLocaleString()}.`,
          channel: 'email',
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send check-out notification: ${error.message}`, error.stack);
      // Don't fail the check-out if notification fails
    }
  }
}

