import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from './campaign.entity';
import { CommunicationChannel } from '../../../common/enums/communication-channel.enum';

@Entity('campaign_results')
export class CampaignResult extends BaseEntity {
  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({
    type: 'enum',
    enum: CommunicationChannel,
  })
  channel: CommunicationChannel;

  @Column({ name: 'total_sent', type: 'integer', default: 0 })
  totalSent: number;

  @Column({ name: 'total_delivered', type: 'integer', default: 0 })
  totalDelivered: number;

  @Column({ name: 'total_opened', type: 'integer', default: 0 })
  totalOpened: number;

  @Column({ name: 'total_clicked', type: 'integer', default: 0 })
  totalClicked: number;

  @Column({ name: 'total_converted', type: 'integer', default: 0 })
  totalConverted: number;

  @Column({ name: 'bounce_count', type: 'integer', default: 0 })
  bounceCount: number;

  @Column({ name: 'unsubscribe_count', type: 'integer', default: 0 })
  unsubscribeCount: number;

  // Relations
  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}


