import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { EmailTemplate } from './email-template.entity';

@Entity('email_automation_rules')
export class EmailAutomationRule extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'rule_name', type: 'text' })
  ruleName: string;

  @Column({ name: 'trigger_event', type: 'text' })
  triggerEvent: string;

  @Column({ name: 'trigger_conditions', type: 'jsonb', default: {} })
  triggerConditions: Record<string, any>;

  @Column({ name: 'email_template_id', type: 'uuid', nullable: true })
  emailTemplateId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  // Relations
  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;

  @ManyToOne(() => EmailTemplate, { nullable: true })
  @JoinColumn({ name: 'email_template_id' })
  emailTemplate: EmailTemplate | null;
}


