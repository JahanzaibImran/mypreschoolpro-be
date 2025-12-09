import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from '../../leads/entities/lead.entity';
import { EmailType } from '../../../common/enums/email-type.enum';
import { EmailStatus } from '../../../common/enums/email-status.enum';

@Entity('email_logs')
export class EmailLog extends BaseEntity {
  @Column({ name: 'recipient_email', type: 'varchar', length: 255 })
  recipientEmail: string;

  @Column({
    name: 'email_type',
    type: 'enum',
    enum: EmailType,
  })
  emailType: EmailType;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ name: 'lead_id', type: 'uuid', nullable: true })
  leadId: string | null;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @Column({ name: 'automation_rule_id', type: 'uuid', nullable: true })
  automationRuleId: string | null;

  @Column({ name: 'sent_from', type: 'varchar', length: 255, nullable: true })
  sentFrom: string | null;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'clicked_at', type: 'timestamptz', nullable: true })
  clickedAt: Date | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => LeadEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity | null;
}


