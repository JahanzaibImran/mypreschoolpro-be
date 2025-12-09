import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('notification_preferences')
export class NotificationPreference extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'email_enrollments', type: 'boolean', default: true })
  emailEnrollments: boolean;

  @Column({ name: 'email_payments', type: 'boolean', default: true })
  emailPayments: boolean;

  @Column({ name: 'email_staff_updates', type: 'boolean', default: false })
  emailStaffUpdates: boolean;

  @Column({ name: 'email_marketing', type: 'boolean', default: true })
  emailMarketing: boolean;

  @Column({ name: 'sms_enrollments', type: 'boolean', default: true })
  smsEnrollments: boolean;

  @Column({ name: 'sms_payments', type: 'boolean', default: false })
  smsPayments: boolean;

  @Column({ name: 'sms_emergencies', type: 'boolean', default: true })
  smsEmergencies: boolean;

  @Column({ name: 'push_notifications', type: 'boolean', default: true })
  pushNotifications: boolean;

  @Column({ name: 'weekly_reports', type: 'boolean', default: true })
  weeklyReports: boolean;

  @Column({ name: 'monthly_reports', type: 'boolean', default: true })
  monthlyReports: boolean;
}


