import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from './lead.entity';

@Entity('lead_interactions')
export class LeadInteraction extends BaseEntity {
  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'interaction_type', type: 'varchar', length: 100 })
  interactionType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string | null;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ name: 'interaction_date', type: 'timestamptz', default: () => 'now()' })
  interactionDate: Date;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;
}


