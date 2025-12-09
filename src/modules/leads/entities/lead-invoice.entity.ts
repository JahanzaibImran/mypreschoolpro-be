import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from './lead.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { CustomForm } from '../../forms/entities/custom-form.entity';
import { CustomFormSubmission } from '../../forms/entities/custom-form-submission.entity';
import { LeadInvoiceItem } from './lead-invoice-item.entity';

@Entity('lead_invoices')
export class LeadInvoice extends BaseEntity {
  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'parent_email', type: 'varchar', length: 255 })
  parentEmail: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100, unique: true })
  invoiceNumber: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ name: 'stripe_session_id', type: 'varchar', length: 255, nullable: true })
  stripeSessionId: string | null;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'custom_form_id', type: 'uuid', nullable: true })
  customFormId: string | null;

  @Column({ name: 'form_submission_id', type: 'uuid', nullable: true })
  formSubmissionId: string | null;

  @Column({ name: 'form_required', type: 'boolean', default: false })
  formRequired: boolean;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;

  @ManyToOne(() => CustomForm, { nullable: true })
  @JoinColumn({ name: 'custom_form_id' })
  customForm: CustomForm | null;

  @ManyToOne(() => CustomFormSubmission, { nullable: true })
  @JoinColumn({ name: 'form_submission_id' })
  formSubmission: CustomFormSubmission | null;

  @OneToMany(() => LeadInvoiceItem, (item) => item.leadInvoice)
  items: LeadInvoiceItem[];
}


