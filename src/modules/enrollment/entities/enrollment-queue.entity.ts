import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from '../../leads/entities/lead.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

export enum EnrollmentQueueStatus {
  WAITING = 'waiting',
  OFFERED = 'offered',
  ENROLLED = 'enrolled',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('enrollment_queue')
export class EnrollmentQueue extends BaseEntity {
  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'queue_position', type: 'integer' })
  queuePosition: number;

  @Column({ name: 'priority_score', type: 'integer', default: 0 })
  priorityScore: number;

  @Column({
    type: 'enum',
    enum: EnrollmentQueueStatus,
    default: EnrollmentQueueStatus.WAITING,
  })
  status: EnrollmentQueueStatus;

  @Column({ name: 'date_joined', type: 'timestamptz', default: () => 'now()' })
  dateJoined: Date;

  @Column({ name: 'offer_date', type: 'timestamptz', nullable: true })
  offerDate: Date | null;

  @Column({ name: 'offer_expires_at', type: 'timestamptz', nullable: true })
  offerExpiresAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


