import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from '../communications/entities/notification-preference.entity';

export interface NotificationPreferencesDto {
  id?: string;
  email_enrollments: boolean;
  email_payments: boolean;
  email_staff_updates: boolean;
  email_marketing: boolean;
  sms_enrollments: boolean;
  sms_payments: boolean;
  sms_emergencies: boolean;
  push_notifications: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
}

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(
    @InjectRepository(NotificationPreference)
    private readonly preferencesRepository: Repository<NotificationPreference>,
  ) {}

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreferencesDto | null> {
    try {
      const preferences = await this.preferencesRepository.findOne({
        where: { userId },
      });

      if (!preferences) {
        return null;
      }

      return {
        id: preferences.id,
        email_enrollments: preferences.emailEnrollments,
        email_payments: preferences.emailPayments,
        email_staff_updates: preferences.emailStaffUpdates,
        email_marketing: preferences.emailMarketing,
        sms_enrollments: preferences.smsEnrollments,
        sms_payments: preferences.smsPayments,
        sms_emergencies: preferences.smsEmergencies,
        push_notifications: preferences.pushNotifications,
        weekly_reports: preferences.weeklyReports,
        monthly_reports: preferences.monthlyReports,
      };
    } catch (error) {
      this.logger.error(`Error fetching preferences for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upsert notification preferences for a user
   */
  async upsertPreferences(
    userId: string,
    preferences: Partial<NotificationPreferencesDto>,
  ): Promise<NotificationPreferencesDto> {
    try {
      const existing = await this.preferencesRepository.findOne({
        where: { userId },
      });

      const prefsData = {
        userId,
        emailEnrollments: preferences.email_enrollments ?? existing?.emailEnrollments ?? true,
        emailPayments: preferences.email_payments ?? existing?.emailPayments ?? true,
        emailStaffUpdates: preferences.email_staff_updates ?? existing?.emailStaffUpdates ?? false,
        emailMarketing: preferences.email_marketing ?? existing?.emailMarketing ?? true,
        smsEnrollments: preferences.sms_enrollments ?? existing?.smsEnrollments ?? true,
        smsPayments: preferences.sms_payments ?? existing?.smsPayments ?? false,
        smsEmergencies: preferences.sms_emergencies ?? existing?.smsEmergencies ?? true,
        pushNotifications: preferences.push_notifications ?? existing?.pushNotifications ?? true,
        weeklyReports: preferences.weekly_reports ?? existing?.weeklyReports ?? true,
        monthlyReports: preferences.monthly_reports ?? existing?.monthlyReports ?? true,
      };

      const saved = await this.preferencesRepository.save(
        existing
          ? { ...existing, ...prefsData }
          : this.preferencesRepository.create(prefsData),
      );

      return {
        id: saved.id,
        email_enrollments: saved.emailEnrollments,
        email_payments: saved.emailPayments,
        email_staff_updates: saved.emailStaffUpdates,
        email_marketing: saved.emailMarketing,
        sms_enrollments: saved.smsEnrollments,
        sms_payments: saved.smsPayments,
        sms_emergencies: saved.smsEmergencies,
        push_notifications: saved.pushNotifications,
        weekly_reports: saved.weeklyReports,
        monthly_reports: saved.monthlyReports,
      };
    } catch (error) {
      this.logger.error(`Error upserting preferences for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}






