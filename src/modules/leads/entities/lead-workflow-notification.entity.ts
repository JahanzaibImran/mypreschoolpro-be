import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from './lead.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

export enum WorkflowNotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('lead_workflow_notifications')
export class LeadWorkflowNotification extends BaseEntity {
  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'recipient_email', type: 'varchar', length: 255 })
  recipientEmail: string;

  @Column({ name: 'recipient_type', type: 'varchar', length: 100 })
  recipientType: string;

  @Column({ name: 'notification_type', type: 'varchar', length: 100 })
  notificationType: string;

  @Column({
    type: 'enum',
    enum: WorkflowNotificationStatus,
    default: WorkflowNotificationStatus.PENDING,
  })
  status: WorkflowNotificationStatus;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


