import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Campaign } from './campaign.entity';

@Entity('campaign_schedule_config')
export class CampaignScheduleConfig extends BaseEntity {
  @Column({ name: 'campaign_id', type: 'uuid', unique: true })
  campaignId: string;

  @Column({ name: 'send_immediately', type: 'boolean', default: false })
  sendImmediately: boolean;

  @Column({ name: 'scheduled_time', type: 'timestamptz', nullable: true })
  scheduledTime: Date | null;

  @Column({ name: 'time_zone', type: 'varchar', length: 50, default: 'UTC' })
  timeZone: string;

  @Column({ type: 'boolean', default: false })
  recurring: boolean;

  @Column({ name: 'recurring_pattern', type: 'jsonb', nullable: true })
  recurringPattern: Record<string, any> | null;

  @Column({ name: 'batch_size', type: 'integer', default: 100 })
  batchSize: number;

  @Column({ name: 'batch_interval_minutes', type: 'integer', default: 5 })
  batchIntervalMinutes: number;

  @Column({ name: 'respect_quiet_hours', type: 'boolean', default: true })
  respectQuietHours: boolean;

  @Column({ name: 'quiet_hours_start', type: 'time', default: '22:00:00' })
  quietHoursStart: string;

  @Column({ name: 'quiet_hours_end', type: 'time', default: '08:00:00' })
  quietHoursEnd: string;

  // Relations
  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}


