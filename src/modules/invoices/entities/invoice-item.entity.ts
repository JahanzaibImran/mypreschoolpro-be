import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem extends BaseEntity {
  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'integer' })
  unitPrice: number; // Price per unit in cents

  @Column({ type: 'integer' })
  total: number; // Total amount in cents (quantity * unitPrice)

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null; // e.g., 'tuition', 'registration', 'supplies'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // Relations
  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}



