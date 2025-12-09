import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRoleEntity } from '../../users/entities/user-role.entity';
import { LeadEntity } from '../../leads/entities/lead.entity';
import { EnrollmentEntity } from '../../enrollment/entities/enrollment.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';

export enum SchoolStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum SchoolSubscriptionStatus {
  ACTIVE = 'active',
  OVERDUE = 'overdue',
  DISABLED = 'disabled',
}

@Entity('schools')
export class SchoolEntity extends BaseEntity {

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'owner_id' })
  ownerId: string | null;

  @Column({ type: 'integer', default: 0 })
  capacity: number;

  @Column({ type: 'text', array: true, default: '{}', name: 'programs_offered' })
  programsOffered: string[];

  @Column({
    type: 'enum',
    enum: SchoolStatus,
    default: SchoolStatus.ACTIVE,
  })
  status: SchoolStatus;

  @Column({
    type: 'enum',
    enum: SchoolSubscriptionStatus,
    default: SchoolSubscriptionStatus.ACTIVE,
    name: 'subscription_status',
  })
  subscriptionStatus: SchoolSubscriptionStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'next_payment_due' })
  nextPaymentDue: Date | null;

  @Column({ type: 'text', nullable: true, name: 'stripe_customer_id' })
  stripeCustomerId: string | null;

  @Column({ type: 'text', nullable: true, name: 'stripe_subscription_id' })
  stripeSubscriptionId: string | null;

  @Column({ type: 'integer', default: 70000, name: 'subscription_amount' })
  subscriptionAmount: number;

  @Column({ type: 'integer', default: 0, name: 'paid_in_advance_period' })
  paidInAdvancePeriod: number;

  @Column({ type: 'integer', nullable: true, name: 'discounted_amount' })
  discountedAmount: number | null;

  @Column({ type: 'boolean', default: false, name: 'access_disabled' })
  accessDisabled: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_payment_date' })
  lastPaymentDate: Date | null;

  @Column({ type: 'integer', default: 0, name: 'payment_retry_count' })
  paymentRetryCount: number;

  @Column({ type: 'numeric', nullable: true })
  latitude: number | null;

  @Column({ type: 'numeric', nullable: true })
  longitude: number | null;

  @OneToMany(() => UserRoleEntity, (role) => role.school)
  userRoles: UserRoleEntity[];

  @OneToMany(() => LeadEntity, (lead) => lead.school)
  leads: LeadEntity[];

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.school)
  enrollments: EnrollmentEntity[];

  @OneToMany(() => ClassEntity, (classEntity) => classEntity.school)
  classes: ClassEntity[];

  @OneToMany(() => Campaign, (campaign) => campaign.school)
  campaigns: Campaign[];
}

