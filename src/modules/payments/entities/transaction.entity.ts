import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { SchoolEntity } from '../../schools/entities/school.entity';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string | null;

  @Column({ type: 'integer' })
  amount: number; // Amount in cents

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ name: 'payment_type', type: 'varchar', length: 50 })
  paymentType: string; // e.g., 'one_time', 'subscription', 'refund'

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ name: 'stripe_session_id', type: 'varchar', length: 255, nullable: true })
  stripeSessionId: string | null;

  @Column({ name: 'cardconnect_transaction_id', type: 'varchar', length: 255, nullable: true })
  cardconnectTransactionId: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => SchoolEntity, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity | null;
}



