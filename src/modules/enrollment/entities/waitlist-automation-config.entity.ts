import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

@Entity('waitlist_automation_config')
export class WaitlistAutomationConfig extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 255 })
  program: string;

  @Column({ name: 'auto_progression_enabled', type: 'boolean', default: true })
  autoProgressionEnabled: boolean;

  @Column({ name: 'min_score_threshold', type: 'integer', default: 100 })
  minScoreThreshold: number;

  @Column({ name: 'priority_criteria', type: 'jsonb', default: {} })
  priorityCriteria: Record<string, any>;

  @Column({ name: 'notification_enabled', type: 'boolean', default: true })
  notificationEnabled: boolean;

  // Relations
  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


