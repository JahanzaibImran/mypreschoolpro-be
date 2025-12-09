import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from './school.entity';

export enum SchoolPaymentType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  MANUAL = 'manual',
}

export enum SchoolPaymentMethod {
  STRIPE = 'stripe',
  MANUAL = 'manual',
  BANK_TRANSFER = 'bank_transfer',
}

export enum SchoolPaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('school_payments')
export class SchoolPayment extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({
    name: 'payment_type',
    type: 'enum',
    enum: SchoolPaymentType,
  })
  paymentType: SchoolPaymentType;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: SchoolPaymentMethod,
    default: SchoolPaymentMethod.STRIPE,
  })
  paymentMethod: SchoolPaymentMethod;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ name: 'stripe_invoice_id', type: 'varchar', length: 255, nullable: true })
  stripeInvoiceId: string | null;

  @Column({ name: 'stripe_session_id', type: 'varchar', length: 255, nullable: true })
  stripeSessionId: string | null;

  @Column({ name: 'transaction_reference', type: 'varchar', length: 255, nullable: true })
  transactionReference: string | null;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: SchoolPaymentStatus,
    default: SchoolPaymentStatus.PENDING,
  })
  paymentStatus: SchoolPaymentStatus;

  @Column({ name: 'payment_date', type: 'timestamptz', nullable: true })
  paymentDate: Date | null;

  @Column({ name: 'period_start', type: 'timestamptz', nullable: true })
  periodStart: Date | null;

  @Column({ name: 'period_end', type: 'timestamptz', nullable: true })
  periodEnd: Date | null;

  @Column({ name: 'discount_applied', type: 'integer', default: 0 })
  discountApplied: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'processed_by', type: 'uuid', nullable: true })
  processedBy: string | null;

  // Relations
  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


