import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from './lead.entity';
import { ReminderStatusType } from '../../../common/enums/reminder-status-type.enum';

@Entity('lead_reminders')
export class LeadReminder extends BaseEntity {
  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ name: 'assigned_to', type: 'uuid' })
  assignedTo: string;

  @Column({ name: 'reminder_type', type: 'varchar', length: 100 })
  reminderType: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'scheduled_for', type: 'timestamptz' })
  scheduledFor: Date;

  @Column({
    type: 'enum',
    enum: ReminderStatusType,
    default: ReminderStatusType.PENDING,
  })
  status: ReminderStatusType;

  @Column({ name: 'recurring_interval', type: 'varchar', length: 50, nullable: true })
  recurringInterval: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;
}


