import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { Notification } from './entities/notification.entity';
import { LeadEntity } from '../leads/entities/lead.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { SchoolEntity, SchoolSubscriptionStatus } from '../schools/entities/school.entity';
import { MailerService } from '../mailer/mailer.service';
import { SendPaymentReminderDto } from './dto/send-payment-reminder.dto';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AppRole } from '../../common/enums/app-role.enum';

@Injectable()
export class PaymentReminderService {
  private readonly logger = new Logger(PaymentReminderService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly notificationTemplateRepository: Repository<NotificationTemplate>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Send payment reminders
   */
  async sendPaymentReminder(
    dto: SendPaymentReminderDto,
    user: AuthUser,
  ): Promise<{ success: boolean; notificationsSent: number }> {
    // Check permissions
    if (dto.recipientType === 'school_owners' && user.primaryRole !== AppRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can send payment reminders to school owners');
    }

    // Fetch active payment_reminder template
    const template = await this.notificationTemplateRepository.findOne({
      where: { type: 'payment_reminder', active: true },
    });

    if (!template) {
      throw new NotFoundException('Payment reminder template not found or inactive');
    }

    let notificationsSent = 0;

    if (dto.recipientType === 'parents') {
      // Send to parents
      const queryBuilder = this.leadRepository
        .createQueryBuilder('lead')
        .leftJoinAndSelect('lead.school', 'school')
        .select([
          'lead.id',
          'lead.parentName',
          'lead.parentEmail',
          'lead.childName',
          'lead.schoolId',
          'school.name',
        ]);

      if (dto.leadId) {
        queryBuilder.where('lead.id = :leadId', { leadId: dto.leadId });
      }

      const leads = await queryBuilder.getMany();

      for (const lead of leads) {
        // Get parent user ID from email
        const profile = await this.profileRepository.findOne({
          where: { email: lead.parentEmail },
          select: ['id'],
        });

        if (!profile) {
          this.logger.warn(`Profile not found for email: ${lead.parentEmail}`);
          continue;
        }

        // Replace template variables
        const subject = this.replaceVariables(template.subject, {
          parent_name: lead.parentName || 'Parent',
          child_name: lead.childName || 'Child',
          amount: `$${dto.amount}`,
          due_date: dto.dueDate,
          school_name: lead.school?.name || 'PreSchool Pro',
        });

        let content = this.replaceVariables(template.content, {
          parent_name: lead.parentName || 'Parent',
          child_name: lead.childName || 'Child',
          amount: `$${dto.amount}`,
          due_date: dto.dueDate,
          school_name: lead.school?.name || 'PreSchool Pro',
        });

        if (dto.message) {
          content += `\n\nAdditional note: ${dto.message}`;
        }

        // Send email via mailer service
        try {
          await this.mailerService.sendEmail({
            to: lead.parentEmail,
            subject,
            html: content,
            emailType: 'payment_reminder',
            userId: profile.id,
            schoolId: lead.schoolId || undefined,
            metadata: {
              leadId: lead.id,
              amount: dto.amount,
              dueDate: dto.dueDate,
            },
          });
        } catch (error) {
          this.logger.error(`Failed to send email to ${lead.parentEmail}: ${error.message}`);
          continue;
        }

        // Create notification
        const notification = this.notificationRepository.create({
          userId: profile.id,
          type: 'payment_reminder' as any,
          title: subject,
          message: content,
          read: false,
        });

        await this.notificationRepository.save(notification);
        notificationsSent++;
      }
    } else if (dto.recipientType === 'school_owners') {
      // Send to school owners with overdue subscriptions
      const schools = await this.schoolRepository.find({
        where: { subscriptionStatus: SchoolSubscriptionStatus.OVERDUE },
        select: ['id', 'name', 'ownerId'],
      });

      for (const school of schools) {
        if (!school.ownerId) continue;

        const ownerProfile = await this.profileRepository.findOne({
          where: { id: school.ownerId },
          select: ['id', 'email'],
        });

        if (!ownerProfile) continue;

        // Replace template variables
        const subject = this.replaceVariables(template.subject, {
          school_name: school.name,
          amount: `$${dto.amount}`,
          due_date: dto.dueDate,
        });

        let content = this.replaceVariables(template.content, {
          school_name: school.name,
          amount: `$${dto.amount}`,
          due_date: dto.dueDate,
        });

        if (dto.message) {
          content += `\n\nAdditional note: ${dto.message}`;
        }

        // Send email via mailer service
        try {
          await this.mailerService.sendEmail({
            to: ownerProfile.email,
            subject,
            html: content,
            emailType: 'payment_reminder',
            userId: ownerProfile.id,
            schoolId: school.id,
            metadata: {
              schoolId: school.id,
              amount: dto.amount,
              dueDate: dto.dueDate,
            },
          });
        } catch (error) {
          this.logger.error(`Failed to send email to ${ownerProfile.email}: ${error.message}`);
          continue;
        }

        // Create notification
        const notification = this.notificationRepository.create({
          userId: ownerProfile.id,
          type: 'payment_reminder' as any,
          title: subject,
          message: content,
          read: false,
        });

        await this.notificationRepository.save(notification);
        notificationsSent++;
      }
    }

    return { success: true, notificationsSent };
  }

  /**
   * Replace template variables
   */
  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }
}

