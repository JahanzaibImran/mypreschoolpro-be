import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CampaignStatus } from '../../../common/enums/campaign-status.enum';
import { CommunicationChannel } from '../../../common/enums/communication-channel.enum';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { CampaignMessage } from './campaign-message.entity';

@Entity('campaigns')
export class Campaign extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({ type: 'jsonb', name: 'target_audience', default: {} })
  targetAudience: Record<string, any>;

  @Column({
    type: 'enum',
    enum: CommunicationChannel,
    array: true,
    name: 'communication_channels',
    default: [],
  })
  communicationChannels: CommunicationChannel[];

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'sent_count', type: 'int', default: 0 })
  sentCount: number;

  @Column({ name: 'delivered_count', type: 'int', default: 0 })
  deliveredCount: number;

  @Column({ name: 'failed_count', type: 'int', default: 0 })
  failedCount: number;

  @Column({ name: 'open_count', type: 'int', default: 0 })
  openCount: number;

  @Column({ name: 'click_count', type: 'int', default: 0 })
  clickCount: number;

  // Relations
  @ManyToOne(() => SchoolEntity, (school) => school.campaigns)
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;

  @OneToMany(() => CampaignMessage, (message) => message.campaign)
  messages: CampaignMessage[];
}



