import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from './campaign.entity';
import { LeadEntity } from '../../leads/entities/lead.entity';
import { CommunicationChannel } from '../../../common/enums/communication-channel.enum';

@Entity('campaign_recipients')
export class CampaignRecipient extends BaseEntity {
  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({
    type: 'enum',
    enum: CommunicationChannel,
  })
  channel: CommunicationChannel;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'clicked_at', type: 'timestamptz', nullable: true })
  clickedAt: Date | null;

  @Column({ name: 'converted_at', type: 'timestamptz', nullable: true })
  convertedAt: Date | null;

  @Column({ name: 'bounced_at', type: 'timestamptz', nullable: true })
  bouncedAt: Date | null;

  @Column({ name: 'unsubscribed_at', type: 'timestamptz', nullable: true })
  unsubscribedAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  // Relations
  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadEntity;
}


