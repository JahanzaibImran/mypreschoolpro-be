import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from './campaign.entity';
import { CommunicationChannel } from '../../../common/enums/communication-channel.enum';

@Entity('campaign_messages')
export class CampaignMessage extends BaseEntity {
  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({
    type: 'enum',
    enum: CommunicationChannel,
  })
  channel: CommunicationChannel;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  // Relations
  @ManyToOne(() => Campaign, (campaign) => campaign.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}


