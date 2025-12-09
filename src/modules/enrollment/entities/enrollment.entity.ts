import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { LeadEntity } from '../../leads/entities/lead.entity';
import { ClassEntity } from '../../classes/entities/class.entity';

export enum EnrollmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
}

@Entity({ name: 'enrollment' })
export class EnrollmentEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'lead_id' })
  leadId: string;

  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;

  @Column({ type: 'uuid', nullable: false, name: 'school_id' })
  schoolId: string;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;

  @Column({ type: 'uuid', nullable: true, name: 'class_id' })
  classId: string | null;

  @ManyToOne(() => ClassEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity | null;

  @Column({ type: 'text', nullable: false })
  program: string;

  @Column({ type: 'date', name: 'start_date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate: Date | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'tuition_amount', nullable: true })
  tuitionAmount: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'registration_fee', nullable: true })
  registrationFee: number | null;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE,
  })
  status: EnrollmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}

