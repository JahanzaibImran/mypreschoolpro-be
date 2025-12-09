import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

export enum AdHocChargePaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('ad_hoc_charges')
export class AdHocCharge extends BaseEntity {
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'charge_description', type: 'text' })
  chargeDescription: string;

  @Column({ name: 'charge_amount', type: 'integer' })
  chargeAmount: number;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: AdHocChargePaymentStatus,
    default: AdHocChargePaymentStatus.PENDING,
  })
  paymentStatus: AdHocChargePaymentStatus;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId: string | null;

  @Column({ name: 'stripe_session_id', type: 'text', nullable: true })
  stripeSessionId: string | null;

  @Column({ name: 'stripe_payment_intent_id', type: 'text', nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ name: 'transaction_id', type: 'text', nullable: true })
  transactionId: string | null;

  @Column({ name: 'payment_date', type: 'timestamptz', nullable: true })
  paymentDate: Date | null;

  @Column({ name: 'payment_method', type: 'text', default: 'stripe' })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relations
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;

  @ManyToOne(() => Invoice, { nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice | null;
}


