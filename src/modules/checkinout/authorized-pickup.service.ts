import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorizedPickupPerson } from './entities/authorized-pickup-person.entity';
import { Student } from '../students/entities/student.entity';
import { ParentStudent } from './entities/parent-student.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { CreateAuthorizedPickupDto } from './dto/create-authorized-pickup.dto';
import { S3Service } from '../media/s3.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthorizedPickupService {
  private readonly logger = new Logger(AuthorizedPickupService.name);

  constructor(
    @InjectRepository(AuthorizedPickupPerson)
    private readonly authorizedPickupRepository: Repository<AuthorizedPickupPerson>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(ParentStudent)
    private readonly parentStudentRepository: Repository<ParentStudent>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Create an authorized pickup person
   */
  async createAuthorizedPickup(
    dto: CreateAuthorizedPickupDto,
    parentId: string,
    photoIdFile?: Express.Multer.File,
  ): Promise<AuthorizedPickupPerson> {
    // 1. Verify student exists and parent has access
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
      select: ['id', 'parentEmail', 'schoolId'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify parent access (check by email or parent_students table)
    const parentProfile = await this.profileRepository.findOne({
      where: { id: parentId },
      select: ['email'],
    });

    if (!parentProfile || student.parentEmail?.toLowerCase() !== parentProfile.email?.toLowerCase()) {
      // Check parent_students table
      const parentStudent = await this.parentStudentRepository.findOne({
        where: { parentId, studentId: dto.studentId },
      });

      if (!parentStudent) {
        throw new ForbiddenException('You are not authorized to add pickup persons for this student');
      }
    }

    // 2. Generate unique code
    const uniqueCode = await this.generateUniqueCode();

    // 3. Upload photo ID if provided
    let photoIdUrl: string | null = null;
    if (photoIdFile) {
      try {
        const uploadResult = await this.s3Service.uploadFile(
          photoIdFile,
          `authorized-pickup/${dto.studentId}`,
        );
        photoIdUrl = uploadResult.fileUrl;
      } catch (error) {
        this.logger.error(`Failed to upload photo ID: ${error.message}`, error.stack);
        throw new BadRequestException('Failed to upload photo ID');
      }
    }

    // 4. Create authorized pickup person
    const authorizedPickup = this.authorizedPickupRepository.create({
      studentId: dto.studentId,
      parentId,
      fullName: dto.fullName,
      relationship: dto.relationship,
      phone: dto.phone,
      photoIdUrl,
      uniqueCode,
      isActive: true,
    });

    return this.authorizedPickupRepository.save(authorizedPickup);
  }

  /**
   * Get authorized pickup persons for a student
   */
  async getAuthorizedPickupByStudent(
    studentId: string,
    parentId: string,
  ): Promise<AuthorizedPickupPerson[]> {
    // Verify parent access
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      select: ['id', 'parentEmail'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const parentProfile = await this.profileRepository.findOne({
      where: { id: parentId },
      select: ['email'],
    });

    if (!parentProfile || student.parentEmail?.toLowerCase() !== parentProfile.email?.toLowerCase()) {
      // Check parent_students table
      const parentStudent = await this.parentStudentRepository.findOne({
        where: { parentId, studentId },
      });

      if (!parentStudent) {
        throw new ForbiddenException('You are not authorized to view pickup persons for this student');
      }
    }

    return this.authorizedPickupRepository.find({
      where: { studentId, parentId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Revoke an authorized pickup person
   */
  async revokeAuthorizedPickup(
    id: string,
    revokedBy: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    const authorizedPickup = await this.authorizedPickupRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!authorizedPickup) {
      throw new NotFoundException('Authorized pickup person not found');
    }

    // Verify permissions
    if (!isAdmin && authorizedPickup.parentId !== revokedBy) {
      throw new ForbiddenException('You are not authorized to revoke this pickup person');
    }

    authorizedPickup.isActive = false;
    authorizedPickup.revokedBy = revokedBy;
    authorizedPickup.revokedAt = new Date();

    await this.authorizedPickupRepository.save(authorizedPickup);
  }

  /**
   * Delete an authorized pickup person
   */
  async deleteAuthorizedPickup(id: string, parentId: string): Promise<void> {
    const authorizedPickup = await this.authorizedPickupRepository.findOne({
      where: { id },
    });

    if (!authorizedPickup) {
      throw new NotFoundException('Authorized pickup person not found');
    }

    if (authorizedPickup.parentId !== parentId) {
      throw new ForbiddenException('You are not authorized to delete this pickup person');
    }

    // Delete photo ID from S3 if exists
    if (authorizedPickup.photoIdUrl) {
      try {
        await this.s3Service.deleteFile(authorizedPickup.photoIdUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete photo ID from S3: ${error.message}`);
      }
    }

    await this.authorizedPickupRepository.remove(authorizedPickup);
  }

  /**
   * Generate unique code for authorized pickup person
   */
  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate 6-digit code
      code = randomBytes(3).toString('hex').toUpperCase().substring(0, 6);
      
      const existing = await this.authorizedPickupRepository.findOne({
        where: { uniqueCode: code },
      });

      if (!existing) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('Failed to generate unique code. Please try again.');
    }

    return code!;
  }
}

