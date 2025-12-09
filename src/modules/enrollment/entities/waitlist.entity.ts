import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from '../../leads/entities/lead.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { LeadStatusType } from '../../../common/enums/lead-status-type.enum';

@Entity('waitlist')
export class Waitlist extends BaseEntity {
  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 255 })
  program: string;

  @Column({ name: 'waitlist_position', type: 'integer' })
  waitlistPosition: number;

  @Column({ name: 'priority_score', type: 'integer', default: 0 })
  priorityScore: number;

  @Column({ name: 'offer_date', type: 'timestamptz', nullable: true })
  offerDate: Date | null;

  @Column({ name: 'offer_expires_at', type: 'timestamptz', nullable: true })
  offerExpiresAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId: string | null;

  @Column({
    type: 'enum',
    enum: LeadStatusType,
    default: LeadStatusType.WAITLISTED,
  })
  status: LeadStatusType;

  @Column({ name: 'payment_status', type: 'varchar', length: 50, default: 'unpaid' })
  paymentStatus: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;

  @ManyToOne(() => ClassEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity | null;
}


