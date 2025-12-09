import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadNotification } from '../leads/entities/lead-notification.entity';
import { LeadWorkflowNotification } from '../leads/entities/lead-workflow-notification.entity';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AppRole } from '../../common/enums/app-role.enum';

export interface NotificationDto {
  id: string;
  user_id?: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  sent_via_email: boolean;
  created_at: string;
}

export interface WorkflowNotificationForSchoolDto {
  id: string;
  leadId: string;
  schoolId: string;
  recipientEmail: string;
  recipientType: string;
  notificationType: string;
  subject: string;
  content: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  childName: string | null;
  parentName: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(LeadNotification)
    private readonly notificationRepository: Repository<LeadNotification>,
    @InjectRepository(LeadWorkflowNotification)
    private readonly workflowNotificationRepository: Repository<LeadWorkflowNotification>,
  ) {}

  /**
   * Get notifications for a user (from both lead_notifications and lead_workflow_notifications)
   */
  async getUserNotifications(
    userId: string,
    userEmail: string,
    limit: number = 50,
  ): Promise<NotificationDto[]> {
    try {
      // Fetch from lead_notifications table
      const leadNotifications = await this.notificationRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        select: [
          'id',
          'userId',
          'notificationType',
          'title',
          'message',
          'isRead',
          'createdAt',
        ],
      });

      // Fetch from lead_workflow_notifications table by email using query builder to avoid updated_at
      const workflowNotifications = await this.workflowNotificationRepository
        .createQueryBuilder('wn')
        .select([
          'wn.id',
          'wn.createdAt',
          'wn.leadId',
          'wn.schoolId',
          'wn.recipientEmail',
          'wn.recipientType',
          'wn.notificationType',
          'wn.status',
          'wn.subject',
          'wn.content',
          'wn.sentAt',
          'wn.metadata',
        ])
        .where('wn.recipientEmail = :email', { email: userEmail })
        .andWhere('wn.recipientType = :type', { type: 'parent' })
        .orderBy('wn.createdAt', 'DESC')
        .limit(limit)
        .getMany();

      // Transform lead notifications
      const transformedLeadNotifications: NotificationDto[] = leadNotifications.map((n) => ({
        id: n.id,
        user_id: n.userId,
        notification_type: n.notificationType,
        title: n.title,
        message: n.message,
        is_read: n.isRead,
        sent_via_email: false, // lead_notifications doesn't track this
        created_at: n.createdAt.toISOString(),
      }));

      // Transform workflow notifications
      // Note: workflow notifications use metadata to track read status
      const transformedWorkflowNotifications: NotificationDto[] = workflowNotifications.map((wn) => ({
        id: wn.id,
        notification_type: wn.notificationType,
        title: wn.subject,
        message: wn.content,
        is_read: wn.metadata?.is_read === true || wn.metadata?.read_at !== undefined,
        sent_via_email: wn.sentAt !== null,
        created_at: wn.createdAt.toISOString(),
      }));

      // Combine and sort by created_at
      const allNotifications = [
        ...transformedLeadNotifications,
        ...transformedWorkflowNotifications,
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      return allNotifications;
    } catch (error) {
      this.logger.error(`Error fetching notifications for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get workflow notifications for a school (for admins/staff views)
   */
  async getWorkflowNotificationsForSchool(
    user: AuthUser,
    schoolId?: string,
    limit: number = 50,
  ): Promise<WorkflowNotificationForSchoolDto[]> {
    // Determine effective school scope based on role
    let effectiveSchoolId = schoolId;

    if (user.primaryRole === AppRole.SUPER_ADMIN) {
      // Super admins can see any school or all schools if none specified
      effectiveSchoolId = schoolId || undefined;
    } else {
      // For non-super-admins, restrict to their assigned school
      if (!user.schoolId) {
        throw new ForbiddenException('You do not have a school assigned');
      }

      if (schoolId && schoolId !== user.schoolId) {
        throw new ForbiddenException('You do not have access to this school');
      }

      effectiveSchoolId = user.schoolId;
    }

    const queryBuilder = this.workflowNotificationRepository
      .createQueryBuilder('wn')
      .leftJoinAndSelect('wn.lead', 'lead')
      .select([
        'wn.id',
        'wn.createdAt',
        'wn.leadId',
        'wn.schoolId',
        'wn.recipientEmail',
        'wn.recipientType',
        'wn.notificationType',
        'wn.status',
        'wn.subject',
        'wn.content',
        'wn.sentAt',
        'lead.childName',
        'lead.parentName',
      ])
      .orderBy('wn.createdAt', 'DESC')
      .limit(limit);

    if (effectiveSchoolId) {
      queryBuilder.andWhere('wn.schoolId = :schoolId', { schoolId: effectiveSchoolId });
    }

    const notifications = await queryBuilder.getMany();

    return notifications.map((wn) => ({
      id: wn.id,
      leadId: wn.leadId,
      schoolId: wn.schoolId,
      recipientEmail: wn.recipientEmail,
      recipientType: wn.recipientType,
      notificationType: wn.notificationType,
      subject: wn.subject,
      content: wn.content,
      status: wn.status,
      sentAt: wn.sentAt ? wn.sentAt.toISOString() : null,
      createdAt: wn.createdAt.toISOString(),
      childName: wn.lead ? wn.lead.childName : null,
      parentName: wn.lead ? wn.lead.parentName : null,
    }));
  }

  /**
   * Mark a notification as read (tries both tables)
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      // Try updating in lead_notifications first using raw SQL to avoid updated_at column
      const leadResult = await this.notificationRepository.query(
        `UPDATE lead_notifications SET is_read = $1 WHERE id = $2 AND user_id = $3 RETURNING id`,
        [true, notificationId, userId],
      );

      // If not found in lead_notifications, try lead_workflow_notifications
      if (!leadResult || leadResult.length === 0) {
        const workflowNotif = await this.workflowNotificationRepository.findOne({
          where: { id: notificationId },
        });
        if (workflowNotif) {
          workflowNotif.metadata = {
            ...workflowNotif.metadata,
            is_read: true,
            read_at: new Date().toISOString(),
          };
          await this.workflowNotificationRepository.save(workflowNotif);
        } else {
          throw new NotFoundException(`Notification with ID "${notificationId}" not found`);
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error marking notification ${notificationId} as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user (both tables)
   */
  async markAllAsRead(userId: string, userEmail: string): Promise<void> {
    try {
      await Promise.all([
        // Use raw SQL to avoid updated_at column
        this.notificationRepository.query(
          `UPDATE lead_notifications SET is_read = $1 WHERE user_id = $2 AND is_read = $3`,
          [true, userId, false],
        ),
        (async () => {
          // Use query builder with explicit select to avoid updated_at column
          const workflowNotifs = await this.workflowNotificationRepository
            .createQueryBuilder('wn')
            .select([
              'wn.id',
              'wn.createdAt',
              'wn.leadId',
              'wn.schoolId',
              'wn.recipientEmail',
              'wn.recipientType',
              'wn.notificationType',
              'wn.status',
              'wn.subject',
              'wn.content',
              'wn.sentAt',
              'wn.metadata',
            ])
            .where('wn.recipientEmail = :email', { email: userEmail })
            .andWhere('wn.recipientType = :type', { type: 'parent' })
            .getMany();
          
          await Promise.all(
            workflowNotifs
              .filter((wn) => !(wn.metadata?.is_read === true || wn.metadata?.read_at !== undefined))
              .map((wn) => {
                wn.metadata = {
                  ...wn.metadata,
                  is_read: true,
                  read_at: new Date().toISOString(),
                };
                return this.workflowNotificationRepository.save(wn);
              }),
          );
        })(),
      ]);
    } catch (error) {
      this.logger.error(`Error marking all notifications as read for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a notification (tries both tables)
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      // Try deleting from lead_notifications first
      const leadResult = await this.notificationRepository.delete({
        id: notificationId,
        userId,
      });

      // If not found in lead_notifications, try lead_workflow_notifications
      if (leadResult.affected === 0) {
        const workflowResult = await this.workflowNotificationRepository.delete({
          id: notificationId,
        });

        if (workflowResult.affected === 0) {
          throw new NotFoundException(`Notification with ID "${notificationId}" not found`);
        }
      }
    } catch (error) {
      this.logger.error(`Error deleting notification ${notificationId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get unread count for a user (both tables)
   */
  async getUnreadCount(userId: string, userEmail: string): Promise<number> {
    try {
      const [leadCount, workflowCount] = await Promise.all([
        this.notificationRepository.count({
          where: { userId, isRead: false },
        }),
        (async () => {
          // Use query builder with explicit select to avoid updated_at column
          const workflowNotifs = await this.workflowNotificationRepository
            .createQueryBuilder('wn')
            .select([
              'wn.id',
              'wn.createdAt',
              'wn.leadId',
              'wn.schoolId',
              'wn.recipientEmail',
              'wn.recipientType',
              'wn.notificationType',
              'wn.status',
              'wn.subject',
              'wn.content',
              'wn.sentAt',
              'wn.metadata',
            ])
            .where('wn.recipientEmail = :email', { email: userEmail })
            .andWhere('wn.recipientType = :type', { type: 'parent' })
            .getMany();
          
          return workflowNotifs.filter(
            (wn) => !(wn.metadata?.is_read === true || wn.metadata?.read_at !== undefined),
          ).length;
        })(),
      ]);

      return leadCount + workflowCount;
    } catch (error) {
      this.logger.error(`Error getting unread count for user ${userId}: ${error.message}`);
      return 0;
    }
  }
}

