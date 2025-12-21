import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnrollmentEntity, EnrollmentStatus } from './entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { SendEnrollmentPacketDto } from './dto/send-enrollment-packet.dto';
import { LeadsService } from '../leads/leads.service';
import { S3Service } from '../media/s3.service';
import { MailerService } from '../mailer/mailer.service';
import { EnrollmentPacketTracking, PacketTrackingStatus } from './entities/enrollment-packet-tracking.entity';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
    @InjectRepository(EnrollmentPacketTracking)
    private readonly packetTrackingRepository: Repository<EnrollmentPacketTracking>,
    private readonly leadsService: LeadsService,
    private readonly s3Service: S3Service,
    private readonly mailerService: MailerService,
  ) { }

  /**
   * Create a new enrollment
   */
  async create(createEnrollmentDto: CreateEnrollmentDto, createdBy?: string): Promise<EnrollmentEntity> {
    this.logger.log(`Creating enrollment for school: ${createEnrollmentDto.schoolId}`);

    const enrollment = this.enrollmentRepository.create({
      leadId: createEnrollmentDto.leadId,
      schoolId: createEnrollmentDto.schoolId,
      classId: createEnrollmentDto.classId ?? null,
      program: createEnrollmentDto.program,
      startDate: createEnrollmentDto.startDate ? new Date(createEnrollmentDto.startDate) : null,
      endDate: createEnrollmentDto.endDate ? new Date(createEnrollmentDto.endDate) : null,
      tuitionAmount: createEnrollmentDto.tuitionAmount ?? null,
      registrationFee: createEnrollmentDto.registrationFee ?? null,
      status: createEnrollmentDto.status || EnrollmentStatus.ACTIVE,
      notes: createEnrollmentDto.notes ?? null,
    });
    const saveResult = await this.enrollmentRepository.save(enrollment);

    // TypeORM save() can return array or single entity, ensure we have a single entity
    const savedEnrollment = Array.isArray(saveResult) ? saveResult[0] : saveResult;

    if (!savedEnrollment || !savedEnrollment.id) {
      throw new BadRequestException('Failed to create enrollment');
    }

    try {
      await this.leadsService.convertToEnrollment(
        createEnrollmentDto.leadId,
        savedEnrollment.id,
        createdBy,
      );
    } catch (error: any) {
      this.logger.warn(`Failed to update lead ${createEnrollmentDto.leadId}: ${error.message}`);
    }

    return savedEnrollment;
  }

  /**
   * Find all enrollments with optional filtering
   */
  async findAll(options?: {
    schoolId?: string;
    status?: EnrollmentStatus;
    classId?: string;
    leadId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: EnrollmentEntity[]; total: number }> {
    const {
      schoolId,
      status,
      classId,
      leadId,
      limit = 100,
      offset = 0,
    } = options || {};

    const queryBuilder = this.enrollmentRepository.createQueryBuilder('enrollment');

    if (schoolId) {
      queryBuilder.where('enrollment.school_id = :schoolId', { schoolId });
    }

    if (status) {
      queryBuilder.andWhere('enrollment.status = :status', { status });
    }

    if (classId) {
      queryBuilder.andWhere('enrollment.class_id = :classId', { classId });
    }

    if (leadId) {
      queryBuilder.andWhere('enrollment.lead_id = :leadId', { leadId });
    }

    queryBuilder
      .orderBy('enrollment.created_at', 'DESC')
      .skip(offset)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Find an enrollment by ID
   */
  async findOne(id: string): Promise<EnrollmentEntity> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['school', 'lead', 'class'],
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID "${id}" not found`);
    }

    return enrollment;
  }

  /**
   * Find enrollments by school ID
   */
  async findBySchool(schoolId: string, options?: {
    status?: EnrollmentStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: EnrollmentEntity[]; total: number }> {
    return this.findAll({
      schoolId,
      ...options,
    });
  }

  /**
   * Find active enrollments
   */
  async findActive(schoolId?: string): Promise<EnrollmentEntity[]> {
    const queryBuilder = this.enrollmentRepository.createQueryBuilder('enrollment');

    queryBuilder.where('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE });

    if (schoolId) {
      queryBuilder.andWhere('enrollment.school_id = :schoolId', { schoolId });
    }

    queryBuilder.orderBy('enrollment.start_date', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Get lead IDs for active enrollments
   * Note: The database column is 'lead_id' (as per Supabase schema)
   * This matches the original Supabase query: SELECT lead_id FROM enrollment WHERE status = 'active'
   */
  async getActiveLeadIds(schoolId?: string, studentIds?: string[]): Promise<string[]> {
    // Use raw query since 'lead_id' column exists in DB but may not be mapped in entity
    let query = `
      SELECT lead_id 
      FROM enrollment 
      WHERE status = 'active' 
      AND lead_id IS NOT NULL
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (schoolId) {
      query += ` AND school_id = $${paramIndex}`;
      params.push(schoolId);
      paramIndex++;
    }

    if (studentIds && studentIds.length > 0) {
      const placeholders = studentIds.map((_, index) => `$${paramIndex + index}`).join(', ');
      query += ` AND lead_id IN (${placeholders})`;
      params.push(...studentIds);
    }

    const results = await this.enrollmentRepository.query(query, params);
    return results.map((r: any) => r.lead_id).filter((id: string) => id !== null);
  }

  /**
   * Update an enrollment
   */
  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto): Promise<EnrollmentEntity> {
    this.logger.log(`Updating enrollment: ${id}`);

    const enrollment = await this.findOne(id);

    const updateData: any = { ...updateEnrollmentDto };
    if (updateEnrollmentDto.startDate !== undefined) {
      updateData.startDate = updateEnrollmentDto.startDate
        ? new Date(updateEnrollmentDto.startDate)
        : null;
    }
    if (updateEnrollmentDto.endDate !== undefined) {
      updateData.endDate = updateEnrollmentDto.endDate
        ? new Date(updateEnrollmentDto.endDate)
        : null;
    }

    Object.assign(enrollment, updateData);
    return this.enrollmentRepository.save(enrollment);
  }

  /**
   * Update enrollment status
   */
  async updateStatus(
    id: string,
    status: EnrollmentStatus,
    endDate?: Date,
  ): Promise<EnrollmentEntity> {
    this.logger.log(`Updating enrollment ${id} status to ${status}`);

    const enrollment = await this.findOne(id);
    enrollment.status = status;

    if (endDate) {
      enrollment.endDate = endDate;
    }

    // If completing or withdrawing, set end date if not already set
    if (
      (status === EnrollmentStatus.COMPLETED || status === EnrollmentStatus.WITHDRAWN) &&
      !enrollment.endDate
    ) {
      enrollment.endDate = new Date();
    }

    return this.enrollmentRepository.save(enrollment);
  }

  /**
   * Delete an enrollment
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting enrollment: ${id}`);

    const enrollment = await this.findOne(id);
    await this.enrollmentRepository.remove(enrollment);
  }

  /**
   * Check if an enrollment exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.enrollmentRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Get enrollment statistics for a school
   */
  async getStatistics(schoolId: string): Promise<{
    total: number;
    byStatus: Record<EnrollmentStatus, number>;
    active: number;
    pending: number;
    completed: number;
    suspended: number;
    withdrawn: number;
  }> {
    const enrollments = await this.enrollmentRepository.find({
      where: { schoolId },
    });

    const byStatus: Record<EnrollmentStatus, number> = {
      [EnrollmentStatus.PENDING]: 0,
      [EnrollmentStatus.ACTIVE]: 0,
      [EnrollmentStatus.SUSPENDED]: 0,
      [EnrollmentStatus.COMPLETED]: 0,
      [EnrollmentStatus.WITHDRAWN]: 0,
    };

    let active = 0;
    let pending = 0;
    let completed = 0;
    let suspended = 0;
    let withdrawn = 0;

    enrollments.forEach((enrollment) => {
      if (byStatus[enrollment.status] !== undefined) {
        byStatus[enrollment.status]++;
      }
      if (enrollment.status === EnrollmentStatus.ACTIVE) active++;
      if (enrollment.status === EnrollmentStatus.PENDING) pending++;
      if (enrollment.status === EnrollmentStatus.COMPLETED) completed++;
      if (enrollment.status === EnrollmentStatus.SUSPENDED) suspended++;
      if (enrollment.status === EnrollmentStatus.WITHDRAWN) withdrawn++;
    });

    return {
      total: enrollments.length,
      byStatus,
      active,
      pending,
      completed,
      suspended,
      withdrawn,
    };
  }

  /**
   * Upload enrollment packet to S3 and send email to parent
   */
  async sendEnrollmentPacket(
    file: Express.Multer.File,
    dto: SendEnrollmentPacketDto,
    sentBy: string,
  ): Promise<{ success: boolean; fileUrl: string; trackingId: string }> {
    this.logger.log(`Sending enrollment packet for student ${dto.studentId} to ${dto.parentEmail}`);

    // Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    try {
      // Upload file to S3
      const folder = `${dto.schoolId}/enrollment_packets`;
      const { fileUrl, key } = await this.s3Service.uploadFile(file, folder);

      this.logger.log(`File uploaded to S3: ${fileUrl}`);

      // Validate email address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.parentEmail)) {
        throw new BadRequestException(`Invalid email address: ${dto.parentEmail}`);
      }

      // Prepare email content
      const emailSubject = dto.emailSubject || `Enrollment Packet for ${dto.studentName}`;
      const emailMessage = dto.emailMessage ||
        `Dear Parent,\n\nPlease find attached the enrollment packet for ${dto.studentName}. Kindly review, complete, and return it at your earliest convenience.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards`;

      // Convert newlines to HTML breaks and add download button
      const htmlMessage = emailMessage.replace(/\n/g, '<br>') +
        `<br><br><a href="${fileUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px;">Download Enrollment Packet</a>`;

      // Send email via Resend
      this.logger.log(`Attempting to send enrollment packet email to ${dto.parentEmail}`);
      const emailResult = await this.mailerService.sendEmail({
        to: dto.parentEmail,
        subject: emailSubject,
        html: htmlMessage,
        emailType: 'enrollment_packet',
        schoolId: dto.schoolId,
        metadata: {
          studentId: dto.studentId,
          studentName: dto.studentName,
          fileUrl: fileUrl,
          fileKey: key,
        },
      });

      if (!emailResult.success) {
        const errorMessage = emailResult.error || 'Failed to send email. Please check Resend API configuration.';
        this.logger.error(`Email send failed: ${errorMessage}`);
        throw new BadRequestException(`Failed to send email: ${errorMessage}`);
      }

      this.logger.log(`Email sent successfully: ${emailResult.emailId}`);

      // Update or create tracking record
      let tracking = await this.packetTrackingRepository.findOne({
        where: {
          studentId: dto.studentId,
          schoolId: dto.schoolId,
        },
      });

      if (tracking) {
        tracking.sentAt = new Date();
        tracking.sentBy = sentBy;
        tracking.sentVia = 'email';
        tracking.status = PacketTrackingStatus.SENT;
        tracking.notes = `Enrollment packet sent via email with attachment`;
        tracking = await this.packetTrackingRepository.save(tracking);
      } else {
        tracking = this.packetTrackingRepository.create({
          studentId: dto.studentId,
          schoolId: dto.schoolId,
          sentAt: new Date(),
          sentBy: sentBy,
          sentVia: 'email',
          status: PacketTrackingStatus.SENT,
          notes: `Enrollment packet sent via email with attachment`,
        });
        tracking = await this.packetTrackingRepository.save(tracking);
      }

      // Log activity (optional - don't fail if this fails)
      try {
        await this.leadsService['recordActivity']({
          leadId: dto.studentId,
          userId: sentBy,
          activityType: 'enrollment_packet_sent',
          notes: `Enrollment packet uploaded and sent to ${dto.parentEmail}`,
          metadata: {
            file_path: key,
            file_url: fileUrl,
            email_subject: emailSubject,
          },
        });
      } catch (activityError) {
        this.logger.warn(`Failed to log activity: ${activityError.message}`);
        // Don't throw - activity logging is optional
      }

      this.logger.log(`Enrollment packet sent successfully. Tracking ID: ${tracking.id}`);

      return {
        success: true,
        fileUrl,
        trackingId: tracking.id,
      };
    } catch (error) {
      this.logger.error(`Failed to send enrollment packet: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get active enrollments with lead details for a school
   */
  async findActiveWithLeadDetails(schoolId: string): Promise<Array<{
    id: string;
    lead_id: string;
    class_id: string | null;
    program: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    created_at: string;
    leads: {
      child_name: string | null;
      parent_name: string | null;
      parent_email: string | null;
      parent_phone: string | null;
    } | null;
  }>> {
    this.logger.log(`Fetching active enrollments with lead details for school: ${schoolId}`);

    // Use raw SQL to join with leads table
    const results = await this.enrollmentRepository.query(
      `SELECT 
        e.id,
        e.lead_id,
        e.class_id,
        e.program,
        e.start_date,
        e.end_date,
        e.status,
        e.created_at,
        l.child_name,
        l.parent_name,
        l.parent_email,
        l.parent_phone
      FROM enrollment e
      LEFT JOIN leads l ON l.id = e.lead_id
      WHERE e.school_id = $1
        AND e.status = $2
      ORDER BY e.start_date DESC`,
      [schoolId, EnrollmentStatus.ACTIVE],
    );

    return results.map((row: any) => ({
      id: row.id,
      lead_id: row.lead_id,
      class_id: row.class_id,
      program: row.program,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      created_at: row.created_at,
      leads: row.child_name ? {
        child_name: row.child_name,
        parent_name: row.parent_name,
        parent_email: row.parent_email,
        parent_phone: row.parent_phone,
      } : null,
    }));
  }

  /**
   * Get enrollment packet tracking by student IDs
   */
  async getPacketTrackingByStudentIds(
    schoolId: string,
    studentIds: string[],
  ): Promise<Array<{
    student_id: string;
    status: string;
    sent_at: string | null;
  }>> {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    this.logger.log(`Fetching packet tracking for ${studentIds.length} students in school: ${schoolId}`);

    const results = await this.packetTrackingRepository.query(
      `SELECT student_id, status, sent_at
      FROM enrollment_packet_tracking
      WHERE school_id = $1
        AND student_id = ANY($2::uuid[])`,
      [schoolId, studentIds],
    );

    return results.map((row: any) => ({
      student_id: row.student_id,
      status: row.status,
      sent_at: row.sent_at ? new Date(row.sent_at).toISOString() : null,
    }));
  }

  /**
   * Determine if families already have active enrollments based on parent emails
   */
  async getFamilyActiveStatus(
    schoolId: string,
    parentEmails: string[],
  ): Promise<Record<string, boolean>> {
    if (!parentEmails || parentEmails.length === 0) {
      return {};
    }

    const cleanedEmails = parentEmails
      .map((email) => email?.trim().toLowerCase())
      .filter((email): email is string => !!email);

    if (!cleanedEmails.length) {
      return {};
    }

    this.logger.log(
      `Fetching family active enrollment status for school ${schoolId} with ${cleanedEmails.length} email(s)`,
    );

    const results = await this.enrollmentRepository.query(
      `
      SELECT DISTINCT LOWER(l.parent_email) AS parent_email
      FROM enrollment e
      JOIN leads l ON l.id = e.lead_id
      WHERE e.status = 'active'
        AND e.school_id = $1
        AND LOWER(l.parent_email) = ANY($2)
    `,
      [schoolId, cleanedEmails],
    );

    const statusMap: Record<string, boolean> = {};
    cleanedEmails.forEach((email) => {
      statusMap[email] = false;
    });

    results.forEach((row: any) => {
      if (row.parent_email) {
        statusMap[row.parent_email] = true;
      }
    });

    return statusMap;
  }

  /**
   * Get all enrollments with lead details for a school
   */
  async findAllWithLeadDetails(schoolId: string): Promise<Array<{
    id: string;
    lead_id: string | null;
    class_id: string | null;
    program: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    created_at: string;
    leads: {
      child_name: string | null;
      parent_name: string | null;
      parent_email: string | null;
      parent_phone: string | null;
      assigned_to: string | null;
    } | null;
  }>> {
    this.logger.log(`Fetching enrollments with lead details for school: ${schoolId}`);

    // Use raw SQL to join with leads table
    const results = await this.enrollmentRepository.query(
      `SELECT 
        e.id,
        e.lead_id,
        e.school_id,
        e.class_id,
        e.program,
        e.start_date,
        e.end_date,
        e.status,
        e.tuition_amount,
        e.registration_fee,
        e.created_at,
        l.child_name,
        l.parent_name,
        l.parent_email,
        l.parent_phone,
        l.assigned_to
      FROM enrollment e
      LEFT JOIN leads l ON l.id = e.lead_id
      WHERE e.school_id = $1
      ORDER BY e.created_at DESC`,
      [schoolId],
    );

    return results.map((row: any) => ({
      id: row.id,
      lead_id: row.lead_id,
      school_id: row.school_id,
      class_id: row.class_id,
      program: row.program,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      tuition_amount: row.tuition_amount ? parseFloat(row.tuition_amount) : null,
      registration_fee: row.registration_fee ? parseFloat(row.registration_fee) : null,
      created_at: row.created_at,
      leads: row.child_name ? {
        child_name: row.child_name,
        parent_name: row.parent_name,
        parent_email: row.parent_email,
        parent_phone: row.parent_phone,
        assigned_to: row.assigned_to,
      } : null,
    }));
  }

  /**
   * Get enrollment counts by school IDs (batch)
   */
  async getCountsBySchools(
    schoolIds: string[],
    status?: EnrollmentStatus,
  ): Promise<Record<string, number>> {
    if (schoolIds.length === 0) {
      return {};
    }

    const queryBuilder = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.schoolId', 'schoolId')
      .addSelect('COUNT(enrollment.id)', 'count')
      .where('enrollment.schoolId IN (:...schoolIds)', { schoolIds })
      .groupBy('enrollment.schoolId');

    if (status) {
      queryBuilder.andWhere('enrollment.status = :status', { status });
    }

    const results = await queryBuilder.getRawMany();

    const counts: Record<string, number> = {};
    schoolIds.forEach((id) => {
      counts[id] = 0;
    });

    results.forEach((row: any) => {
      counts[row.schoolId] = parseInt(row.count, 10);
    });

    return counts;
  }
}

