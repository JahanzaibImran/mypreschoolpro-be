import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

@Entity('staff_assignment_rotation')
export class StaffAssignmentRotation extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'assignment_order', type: 'integer' })
  assignmentOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'max_leads_per_cycle', type: 'integer', default: 10 })
  maxLeadsPerCycle: number;

  @Column({ name: 'current_lead_count', type: 'integer', default: 0 })
  currentLeadCount: number;

  @Column({ name: 'last_assigned_at', type: 'timestamptz', nullable: true })
  lastAssignedAt: Date | null;

  // Relations
  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


