import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentDocument, DocumentCategory, DocumentStatus } from './entities/student-document.entity';
import { Student } from './entities/student.entity';
import { StudentAttendance, AttendanceStatus } from './entities/student-attendance.entity';
import { StudentProgress, ProgressStatus } from './entities/student-progress.entity';
import { LeadEntity } from '../leads/entities/lead.entity';
import { EnrollmentEntity, EnrollmentStatus } from '../enrollment/entities/enrollment.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { MediaService } from '../media/media.service';
import { LeadsService } from '../leads/leads.service';
import { S3Service } from '../media/s3.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { ProgressResponseDto } from './dto/progress-response.dto';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

export interface UploadDocumentDto {
    studentId: string;
    schoolId: string;
    documentType: string;
    expiryDate?: string;
    notes?: string;
}

export interface ChildDocumentSummary {
    childId: string;
    childName: string;
    schoolId: string;
    documents: {
        documentType: string;
        status: DocumentStatus;
        fileName: string;
        uploadDate: Date;
    }[];
}

@Injectable()
export class StudentsService {
    private readonly logger = new Logger(StudentsService.name);

    constructor(
        @InjectRepository(StudentDocument)
        private readonly studentDocumentRepository: Repository<StudentDocument>,
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
        @InjectRepository(StudentAttendance)
        private readonly studentAttendanceRepository: Repository<StudentAttendance>,
        @InjectRepository(StudentProgress)
        private readonly studentProgressRepository: Repository<StudentProgress>,
        @InjectRepository(LeadEntity)
        private readonly leadRepository: Repository<LeadEntity>,
        @InjectRepository(EnrollmentEntity)
        private readonly enrollmentRepository: Repository<EnrollmentEntity>,
        @InjectRepository(ClassEntity)
        private readonly classRepository: Repository<ClassEntity>,
        @InjectRepository(UserRoleEntity)
        private readonly userRoleRepository: Repository<UserRoleEntity>,
        @InjectRepository(ProfileEntity)
        private readonly profileRepository: Repository<ProfileEntity>,
        private readonly mediaService: MediaService,
        private readonly leadsService: LeadsService,
        private readonly s3Service: S3Service,
    ) { }

    /**
     * Get all documents for children of a parent by email
     */
    async getDocumentsByParentEmail(parentEmail: string): Promise<ChildDocumentSummary[]> {
        // Find all children (leads) for this parent
        const children = await this.leadRepository.find({
            where: { parentEmail: parentEmail.toLowerCase() },
            select: ['id', 'childName', 'schoolId'],
        });

        if (!children || children.length === 0) {
            return [];
        }

        const childIds = children.map((c) => c.id);

        // Get all documents for these children
        const documents = await this.studentDocumentRepository.find({
            where: childIds.map((id) => ({ studentId: id })),
            order: { uploadDate: 'DESC' },
        });

        // Group documents by child
        const result: ChildDocumentSummary[] = children.map((child) => {
            const childDocs = documents.filter((d) => d.studentId === child.id);

            return {
                childId: child.id,
                childName: child.childName || 'Unknown',
                schoolId: child.schoolId,
                documents: childDocs.map((doc) => ({
                    documentType: doc.documentType,
                    status: doc.status,
                    fileName: doc.fileName,
                    uploadDate: doc.uploadDate,
                })),
            };
        });

        return result;
    }

    /**
     * Get all students for the current user's school
     */
    async getAllStudents(user: AuthUser): Promise<Student[]> {
        const userRoles = user.roles?.map((r) => r.role) || [];
        const isSuperAdmin = userRoles.includes(AppRole.SUPER_ADMIN);

        if (isSuperAdmin) {
            // For now, return all students or maybe throw? 
            // Super admin usually acts within a school context in this app
            // Let's return all for now or check if they have a school attached
        }

        const userRole = await this.userRoleRepository.findOne({
            where: { userId: user.id },
            select: ['schoolId'],
        });

        if (!userRole?.schoolId) {
            // If super admin and no school, maybe return empty?
            if (isSuperAdmin) return [];
            throw new ForbiddenException('User is not associated with any school');
        }

        return this.studentRepository.find({
            where: { schoolId: userRole.schoolId },
            order: { lastName: 'ASC', firstName: 'ASC' },
        });
    }

    /**
     * Upload a student document
     */
    async uploadDocument(
        file: Express.Multer.File,
        dto: UploadDocumentDto,
        uploadedBy: string,
    ): Promise<StudentDocument> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // Validate student exists
        const student = await this.leadRepository.findOne({
            where: { id: dto.studentId },
        });
        if (!student) {
            throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
        }

        // Upload file to S3 using MediaService
        const mediaResult = await this.mediaService.uploadMedia(
            file,
            {
                schoolId: dto.schoolId,
                childId: dto.studentId,
                description: `${dto.documentType} for ${student.childName}`,
                tags: [dto.documentType, 'student_document'],
                isFeatured: false,
            },
            uploadedBy,
        );

        // Determine document category
        const category = this.determineDocumentCategory(dto.documentType);

        // Create database record
        const document = this.studentDocumentRepository.create({
            studentId: dto.studentId,
            schoolId: dto.schoolId,
            documentType: dto.documentType,
            category,
            fileName: file.originalname,
            filePath: mediaResult.fileUrl, // Store S3 URL in file_path
            fileSize: file.size,
            mimeType: file.mimetype,
            storageProvider: 's3',
            uploadedBy,
            uploadDate: new Date(),
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            status: DocumentStatus.PENDING,
            notes: dto.notes || null,
            parentSubmittedAt: new Date(),
        });

        const savedDocument = await this.studentDocumentRepository.save(document);

        // Log activity
        await this.logDocumentActivity(
            dto.studentId,
            uploadedBy,
            'document_uploaded',
            dto.documentType,
            `Parent uploaded ${dto.documentType}`,
        );

        this.logger.log(`Document uploaded successfully: ${savedDocument.id}`);

        return savedDocument;
    }

    /**
     * Get student documents by student IDs with status filter
     */
    async getDocumentsByStudentIds(
        schoolId: string,
        studentIds: string[],
        statuses?: DocumentStatus[],
    ): Promise<Array<{
        student_id: string;
        document_type: string;
    }>> {
        if (!studentIds || studentIds.length === 0) {
            return [];
        }

        this.logger.log(`Fetching documents for ${studentIds.length} students in school: ${schoolId}`);

        const queryBuilder = this.studentDocumentRepository
            .createQueryBuilder('doc')
            .select('doc.studentId', 'student_id')
            .addSelect('doc.documentType', 'document_type')
            .where('doc.schoolId = :schoolId', { schoolId })
            .andWhere('doc.studentId IN (:...studentIds)', { studentIds });

        if (statuses && statuses.length > 0) {
            queryBuilder.andWhere('doc.status IN (:...statuses)', { statuses });
        }

        const results = await queryBuilder.getRawMany();

        return results.map((row: any) => ({
            student_id: row.student_id,
            document_type: row.document_type,
        }));
    }

    /**
     * Get student documents by student ID and school ID
     */
    async getDocuments(studentId: string, schoolId: string, user?: AuthUser): Promise<StudentDocument[]> {
        // Verify user has access to this student
        if (user) {
            const userRoles = user.roles?.map((r) => r.role) || [];
            await this.verifyUserAccess(studentId, user.id, userRoles, user.email || '', true);
        }

        const documents = await this.studentDocumentRepository.find({
            where: {
                studentId,
                schoolId,
            },
            order: {
                uploadDate: 'DESC',
            },
        });

        return documents;
    }

    /**
     * Update document status
     */
    async updateDocument(
        documentId: string,
        status?: string,
        notes?: string,
        user?: AuthUser,
    ): Promise<StudentDocument> {
        const document = await this.studentDocumentRepository.findOne({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException(`Document with ID ${documentId} not found`);
        }

        // Verify user has access to this student's school
        if (user && user.primaryRole !== AppRole.SUPER_ADMIN) {
            const userRoles = user.roles?.map((r) => r.role) || [];
            const isAdminOrAdmissions = userRoles.includes(AppRole.SCHOOL_ADMIN) || userRoles.includes(AppRole.ADMISSIONS_STAFF);

            if (isAdminOrAdmissions) {
                const userRole = await this.userRoleRepository.findOne({
                    where: { userId: user.id },
                    select: ['schoolId'],
                });

                if (!userRole?.schoolId || userRole.schoolId !== document.schoolId) {
                    throw new ForbiddenException('You do not have access to this document');
                }
            } else {
                throw new ForbiddenException('You do not have permission to update documents');
            }
        }

        if (status) {
            document.status = status as DocumentStatus;
        }
        if (notes !== undefined) {
            document.notes = notes;
        }

        return this.studentDocumentRepository.save(document);
    }

    /**
     * Delete a document
     */
    async deleteDocument(documentId: string, user?: AuthUser): Promise<void> {
        const document = await this.studentDocumentRepository.findOne({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException(`Document with ID ${documentId} not found`);
        }

        // Verify user has access to this student's school
        if (user && user.primaryRole !== AppRole.SUPER_ADMIN) {
            const userRoles = user.roles?.map((r) => r.role) || [];
            const isAdminOrAdmissions = userRoles.includes(AppRole.SCHOOL_ADMIN) || userRoles.includes(AppRole.ADMISSIONS_STAFF);

            if (isAdminOrAdmissions) {
                const userRole = await this.userRoleRepository.findOne({
                    where: { userId: user.id },
                    select: ['schoolId'],
                });

                if (!userRole?.schoolId || userRole.schoolId !== document.schoolId) {
                    throw new ForbiddenException('You do not have access to this document');
                }
            } else {
                throw new ForbiddenException('You do not have permission to delete documents');
            }
        }

        // Delete file from S3
        if (document.filePath) {
            try {
                await this.s3Service.deleteFile(document.filePath);
            } catch (error) {
                this.logger.warn(`Failed to delete file from S3: ${error.message}`);
                // Continue with database deletion even if S3 deletion fails
            }
        }

        // Delete database record
        await this.studentDocumentRepository.remove(document);
    }

    /**
     * Get signed URL for downloading a document
     */
    async getDocumentDownloadUrl(documentId: string, user?: AuthUser): Promise<{ url: string; expiresIn: number }> {
        const document = await this.studentDocumentRepository.findOne({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException(`Document with ID ${documentId} not found`);
        }

        // Verify user has access to this student
        if (user) {
            const userRoles = user.roles?.map((r) => r.role) || [];
            await this.verifyUserAccess(document.studentId, user.id, userRoles, user.email || '', true);
        }

        if (!document.filePath) {
            throw new BadRequestException('Document file path is missing');
        }

        const expiresIn = 3600; // 1 hour
        const signedUrl = await this.s3Service.getSignedUrl(document.filePath, expiresIn);

        return {
            url: signedUrl,
            expiresIn,
        };
    }

    /**
     * Determine document category from type
     */
    private determineDocumentCategory(documentType: string): DocumentCategory {
        const requiredTypes = ['enrollment_packet', 'shot_records', 'physical_records'];
        return requiredTypes.includes(documentType)
            ? DocumentCategory.REQUIRED
            : DocumentCategory.OPTIONAL;
    }

    /**
     * Log document activity to lead activities
     */
    private async logDocumentActivity(
        leadId: string,
        userId: string,
        activityType: string,
        newValue: string,
        notes: string,
    ): Promise<void> {
        try {
            // Use the private recordActivity method from LeadsService
            // Since it's private, we'll create the activity directly
            await this.leadsService['recordActivity']({
                leadId,
                userId,
                activityType,
                newValue: { documentType: newValue },
                notes,
            });
        } catch (error: any) {
            this.logger.warn(`Failed to log document activity: ${error.message}`);
        }
    }

    /**
     * Upsert attendance record (create or update)
     * Uses raw SQL to bypass foreign key constraint (student_id references students.id, but we use lead_id)
     */
    async upsertAttendance(dto: UpsertAttendanceDto, teacherId: string): Promise<AttendanceResponseDto> {
        this.logger.log(`Upserting attendance for student ${dto.studentId} on ${dto.date}`);

        // Verify teacher has access to this student
        await this.verifyTeacherAccess(dto.studentId, teacherId);

        // Check if attendance record already exists using raw SQL
        const attendanceDate = new Date(dto.date);
        attendanceDate.setHours(0, 0, 0, 0);
        const dateStr = attendanceDate.toISOString().split('T')[0];

        const existingRecord = await this.studentAttendanceRepository.query(
            `SELECT id, student_id, date, status, notes, created_at, updated_at
             FROM student_attendance
             WHERE student_id = $1 AND date = $2
             LIMIT 1`,
            [dto.studentId, dateStr],
        );

        let attendance: any;

        if (existingRecord && existingRecord.length > 0) {
            // Update existing record using raw SQL
            const result = await this.studentAttendanceRepository.query(
                `UPDATE student_attendance
                 SET status = $1,
                     notes = $2,
                     updated_at = NOW()
                 WHERE id = $3
                 RETURNING id, student_id, date, status, notes, created_at, updated_at`,
                [dto.status, dto.notes || null, existingRecord[0].id],
            );
            attendance = result[0];
        } else {
            // Create new record using raw SQL (bypasses foreign key constraint)
            const result = await this.studentAttendanceRepository.query(
                `INSERT INTO student_attendance (student_id, teacher_id, date, status, notes, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                 RETURNING id, student_id, date, status, notes, created_at, updated_at`,
                [dto.studentId, teacherId, dateStr, dto.status, dto.notes || null],
            );
            attendance = result[0];
        }

        return {
            id: attendance.id,
            studentId: attendance.student_id,
            date: attendance.date instanceof Date
                ? attendance.date.toISOString().split('T')[0]
                : attendance.date,
            status: attendance.status,
            notes: attendance.notes,
            createdAt: attendance.created_at instanceof Date
                ? attendance.created_at.toISOString()
                : attendance.created_at,
            updatedAt: attendance.updated_at instanceof Date
                ? attendance.updated_at.toISOString()
                : attendance.updated_at,
        };
    }

    /**
     * Get attendance records for a student
     */
    async getStudentAttendance(studentId: string, userId: string, userRoles: AppRole[], userEmail: string, limit?: number): Promise<AttendanceResponseDto[]> {
        this.logger.log(`Fetching attendance for student ${studentId}`);

        // Verify user has access to this student
        await this.verifyUserAccess(studentId, userId, userRoles, userEmail, true); // Read-only for parents

        const queryBuilder = this.studentAttendanceRepository
            .createQueryBuilder('attendance')
            .where('attendance.student_id = :studentId', { studentId })
            .orderBy('attendance.date', 'DESC');

        if (limit) {
            queryBuilder.limit(limit);
        }

        const records = await queryBuilder.getMany();

        return records.map((record) => ({
            id: record.id,
            studentId: record.studentId,
            date: record.date instanceof Date ? record.date.toISOString().split('T')[0] : record.date,
            status: record.status,
            notes: record.notes,
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
        }));
    }

    /**
     * Upsert progress record (create or update)
     * Uses raw SQL to bypass foreign key constraint (student_id references students.id, but we use lead_id)
     */
    async upsertProgress(dto: UpsertProgressDto, teacherId: string): Promise<ProgressResponseDto> {
        this.logger.log(`Upserting progress for student ${dto.studentId} in subject ${dto.subject}`);

        // Verify teacher has access to this student
        await this.verifyTeacherAccess(dto.studentId, teacherId);

        // Check if progress record already exists using raw SQL
        const existingRecord = await this.studentProgressRepository.query(
            `SELECT id, student_id, subject, progress_percentage, grade, teacher_comments, status, assessment_date, created_at, updated_at
             FROM student_progress
             WHERE student_id = $1 AND subject = $2
             LIMIT 1`,
            [dto.studentId, dto.subject],
        );

        const assessmentDate = new Date().toISOString().split('T')[0];
        let progress: any;

        if (existingRecord && existingRecord.length > 0) {
            // Update existing record using raw SQL
            const result = await this.studentProgressRepository.query(
                `UPDATE student_progress
                 SET progress_percentage = $1,
                     grade = $2,
                     teacher_comments = $3,
                     assessment_date = $4,
                     status = $5,
                     updated_at = NOW()
                 WHERE id = $6
                 RETURNING id, student_id, subject, progress_percentage, grade, teacher_comments, status, assessment_date, created_at, updated_at`,
                [
                    dto.progressPercentage,
                    dto.grade || null,
                    dto.teacherComments || null,
                    assessmentDate,
                    ProgressStatus.IN_PROGRESS,
                    existingRecord[0].id,
                ],
            );
            progress = result[0];
        } else {
            // Create new record using raw SQL
            // Note: After migration 20251123000000, student_id FK references leads.id
            try {
                const result = await this.studentProgressRepository.query(
                    `INSERT INTO student_progress (student_id, teacher_id, subject, progress_percentage, grade, teacher_comments, assessment_date, status, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                     RETURNING id, student_id, subject, progress_percentage, grade, teacher_comments, status, assessment_date, created_at, updated_at`,
                    [
                        dto.studentId,
                        teacherId,
                        dto.subject,
                        dto.progressPercentage,
                        dto.grade || null,
                        dto.teacherComments || null,
                        assessmentDate,
                        ProgressStatus.IN_PROGRESS,
                    ],
                );
                progress = result[0];
            } catch (error: any) {
                // If FK constraint error, provide helpful message about running migration
                if (error.code === '23503' && error.constraint === 'student_progress_student_id_fkey') {
                    this.logger.error(
                        `Foreign key constraint violation: student_progress.student_id references students.id, but we're using lead_id. ` +
                        `Please run migration 20251123000000_fix_student_progress_foreign_key.sql to fix this.`,
                    );
                    throw new BadRequestException(
                        `Database schema mismatch: The student_progress table's foreign key constraint references students.id, ` +
                        `but the system uses lead_id values. Please run the migration file: ` +
                        `supabase/migrations/20251123000000_fix_student_progress_foreign_key.sql to update the constraint to reference leads.id instead.`,
                    );
                }
                throw error;
            }
        }

        return {
            id: progress.id,
            studentId: progress.student_id,
            subject: progress.subject,
            progressPercentage: Number(progress.progress_percentage),
            grade: progress.grade,
            teacherComments: progress.teacher_comments,
            status: progress.status,
            assessmentDate: progress.assessment_date instanceof Date
                ? progress.assessment_date.toISOString().split('T')[0]
                : progress.assessment_date,
            createdAt: progress.created_at instanceof Date
                ? progress.created_at.toISOString()
                : progress.created_at,
            updatedAt: progress.updated_at instanceof Date
                ? progress.updated_at.toISOString()
                : progress.updated_at,
        };
    }

    /**
     * Get progress records for a student
     */
    async getStudentProgress(studentId: string, userId: string, userRoles: AppRole[], userEmail: string): Promise<ProgressResponseDto[]> {
        this.logger.log(`Fetching progress for student ${studentId}`);

        // Verify user has access to this student
        await this.verifyUserAccess(studentId, userId, userRoles, userEmail, true); // Read-only for parents

        const records = await this.studentProgressRepository.find({
            where: { studentId },
            order: { updatedAt: 'DESC' },
        });

        return records.map((record) => ({
            id: record.id,
            studentId: record.studentId,
            subject: record.subject,
            progressPercentage: Number(record.progressPercentage),
            grade: record.grade,
            teacherComments: record.teacherComments,
            status: record.status,
            assessmentDate: record.assessmentDate instanceof Date
                ? record.assessmentDate.toISOString().split('T')[0]
                : record.assessmentDate,
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
        }));
    }

    /**
     * Verify teacher has access to a student (via enrollment → class → teacher_id)
     */
    private async verifyTeacherAccess(studentId: string, teacherId: string): Promise<void> {
        // studentId is actually lead_id from enrollment
        // Use raw SQL to avoid TypeORM entity column mapping issues
        const result = await this.enrollmentRepository.query(
            `SELECT 1 
             FROM enrollment e
             INNER JOIN classes c ON c.id = e.class_id
             WHERE e.lead_id = $1 
               AND e.status = $2 
               AND c.teacher_id = $3
             LIMIT 1`,
            [studentId, EnrollmentStatus.ACTIVE, teacherId],
        );

        if (!result || result.length === 0) {
            throw new ForbiddenException('You do not have access to this student');
        }
    }

    /**
     * Verify user has access to a student (supports teachers, admins, and parents)
     */
    private async verifyUserAccess(
        studentId: string,
        userId: string,
        userRoles: AppRole[],
        userEmail: string,
        readOnly: boolean = false,
    ): Promise<void> {
        const isTeacher = userRoles.includes(AppRole.TEACHER);
        const isAdminOrAdmissions = userRoles.includes(AppRole.SCHOOL_ADMIN) || userRoles.includes(AppRole.ADMISSIONS_STAFF);
        const isParent = userRoles.includes(AppRole.PARENT);
        const isSuperAdmin = userRoles.includes(AppRole.SUPER_ADMIN);

        if (isSuperAdmin) {
            return; // Super admins have access to everything
        }

        // Get user's school_id
        const userRole = await this.userRoleRepository.findOne({
            where: { userId },
            select: ['schoolId'],
        });

        if (isTeacher) {
            // Teachers can access students in their classes
            await this.verifyTeacherAccess(studentId, userId);
            return;
        }

        if (isAdminOrAdmissions && userRole?.schoolId) {
            // Admins can access students in their school
            // Use raw SQL to avoid TypeORM entity column mapping issues
            const result = await this.enrollmentRepository.query(
                `SELECT 1 
                 FROM enrollment e
                 WHERE e.lead_id = $1 
                   AND e.school_id = $2 
                   AND e.status = $3
                 LIMIT 1`,
                [studentId, userRole.schoolId, EnrollmentStatus.ACTIVE],
            );

            if (!result || result.length === 0) {
                throw new ForbiddenException('You do not have access to this student');
            }
            return;
        }

        if (isParent) {
            // Parents can only view (read-only) their own children
            if (!readOnly) {
                throw new ForbiddenException('Parents can only view attendance and progress, not modify them');
            }

            // Verify the lead's parent_email matches the user's email
            const lead = await this.leadRepository.findOne({
                where: { id: studentId },
                select: ['parentEmail'],
            });

            if (!lead || !lead.parentEmail || lead.parentEmail.toLowerCase() !== userEmail.toLowerCase()) {
                throw new ForbiddenException('You do not have access to this student');
            }
            return;
        }

        throw new ForbiddenException('You do not have permission to access this student');
    }
}
