import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { Campaign } from './campaign.entity';

export enum CampaignTriggerEvent {
  LEAD_CREATED = 'lead_created',
  LEAD_SCORE_UPDATED = 'lead_score_updated',
  WAITLIST_ADDED = 'waitlist_added',
  ENROLLMENT_COMPLETED = 'enrollment_completed',
}

@Entity('campaign_automation')
export class CampaignAutomation extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    name: 'trigger_event',
    type: 'enum',
    enum: CampaignTriggerEvent,
  })
  triggerEvent: CampaignTriggerEvent;

  @Column({ name: 'trigger_conditions', type: 'jsonb', default: {} })
  triggerConditions: Record<string, any>;

  @Column({ name: 'campaign_template_id', type: 'uuid', nullable: true })
  campaignTemplateId: string | null;

  @Column({ name: 'delay_hours', type: 'integer', default: 0 })
  delayHours: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;

  @ManyToOne(() => Campaign, { nullable: true })
  @JoinColumn({ name: 'campaign_template_id' })
  campaignTemplate: Campaign | null;
}


