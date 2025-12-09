import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from './lead.entity';
import { LeadAutomationRule } from './lead-automation-rule.entity';
import { LeadStatusType } from '../../../common/enums/lead-status-type.enum';

@Entity('lead_audit_log')
export class LeadAuditLog extends BaseEntity {
  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'action_type', type: 'varchar', length: 100 })
  actionType: string;

  @Column({ name: 'automation_rule_id', type: 'uuid', nullable: true })
  automationRuleId: string | null;

  @Column({ name: 'is_automated', type: 'boolean', default: false })
  isAutomated: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'old_status', type: 'enum', enum: LeadStatusType, nullable: true })
  oldStatus: LeadStatusType | null;

  @Column({ name: 'new_status', type: 'enum', enum: LeadStatusType, nullable: true })
  newStatus: LeadStatusType | null;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;

  @ManyToOne(() => LeadAutomationRule, { nullable: true })
  @JoinColumn({ name: 'automation_rule_id' })
  automationRule: LeadAutomationRule | null;
}


