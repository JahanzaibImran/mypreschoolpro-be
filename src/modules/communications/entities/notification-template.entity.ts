import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('notification_templates')
export class NotificationTemplate extends BaseEntity {
  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'jsonb', default: {} })
  variables: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'attachment_url', type: 'text', nullable: true })
  attachmentUrl: string | null;

  @Column({ name: 'attachment_name', type: 'text', nullable: true })
  attachmentName: string | null;
}


