import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from '../../leads/entities/lead.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

export enum PacketTrackingStatus {
  NOT_SENT = 'not_sent',
  SENT = 'sent',
  RECEIVED = 'received',
  COMPLETED = 'completed',
}

@Entity('enrollment_packet_tracking')
export class EnrollmentPacketTracking extends BaseEntity {
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'sent_by', type: 'uuid', nullable: true })
  sentBy: string | null;

  @Column({ name: 'sent_via', type: 'varchar', length: 100, nullable: true })
  sentVia: string | null;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt: Date | null;

  @Column({ name: 'uploaded_at', type: 'timestamptz', nullable: true })
  uploadedAt: Date | null;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string | null;

  @Column({
    type: 'enum',
    enum: PacketTrackingStatus,
    default: PacketTrackingStatus.NOT_SENT,
  })
  status: PacketTrackingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: LeadEntity;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


