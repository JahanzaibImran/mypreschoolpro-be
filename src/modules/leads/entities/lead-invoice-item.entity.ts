import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadInvoice } from './lead-invoice.entity';

@Entity('lead_invoice_items')
export class LeadInvoiceItem extends BaseEntity {
  @Column({ name: 'lead_invoice_id', type: 'uuid' })
  leadInvoiceId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  // Relations
  @ManyToOne(() => LeadInvoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_invoice_id' })
  leadInvoice: LeadInvoice;
}


