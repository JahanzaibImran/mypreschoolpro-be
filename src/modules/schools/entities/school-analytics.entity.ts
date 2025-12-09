import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from './school.entity';

@Entity('school_analytics')
export class SchoolAnalytics extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'metric_type', type: 'varchar', length: 100 })
  metricType: string;

  @Column({ name: 'metric_value', type: 'jsonb', default: {} })
  metricValue: Record<string, any>;

  // Relations
  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


