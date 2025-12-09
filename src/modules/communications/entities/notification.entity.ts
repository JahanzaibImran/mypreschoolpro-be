import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum NotificationType {
  ENROLLMENT_OFFER = 'enrollment_offer',
  WAITLIST_UPDATE = 'waitlist_update',
  PAYMENT_REMINDER = 'payment_reminder',
  GENERAL = 'general',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ name: 'action_url', type: 'text', nullable: true })
  actionUrl: string | null;
}


