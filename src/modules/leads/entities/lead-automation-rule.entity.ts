import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { LeadStatusType } from '../../../common/enums/lead-status-type.enum';

@Entity('lead_automation_rules')
export class LeadAutomationRule extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ name: 'rule_name', type: 'varchar', length: 255 })
  ruleName: string;

  @Column({ name: 'trigger_condition', type: 'jsonb', default: {} })
  triggerCondition: Record<string, any>;

  @Column({ name: 'score_threshold', type: 'integer', nullable: true })
  scoreThreshold: number | null;

  @Column({ name: 'days_inactive', type: 'integer', nullable: true })
  daysInactive: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'from_status', type: 'enum', enum: LeadStatusType, nullable: true })
  fromStatus: LeadStatusType | null;

  @Column({ name: 'to_status', type: 'enum', enum: LeadStatusType, nullable: true })
  toStatus: LeadStatusType | null;

  // Relations
  @ManyToOne(() => SchoolEntity, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity | null;
}


