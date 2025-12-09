import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from './campaign.entity';

@Entity('campaign_segments')
export class CampaignSegment extends BaseEntity {
  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({ name: 'segment_type', type: 'varchar', length: 100 })
  segmentType: string;

  @Column({ name: 'segment_criteria', type: 'jsonb', default: {} })
  segmentCriteria: Record<string, any>;

  // Relations
  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}


