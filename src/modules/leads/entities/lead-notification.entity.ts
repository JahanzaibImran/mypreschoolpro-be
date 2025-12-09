import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from './lead.entity';

@Entity('lead_notifications')
export class LeadNotification extends BaseEntity {
  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'notification_type', type: 'varchar', length: 100 })
  notificationType: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'sent_via_email', type: 'boolean', default: false })
  sentViaEmail: boolean;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;
}


