import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('impersonation_logs')
export class ImpersonationSession extends BaseEntity {
  @Column({ name: 'super_admin_id', type: 'uuid' })
  superAdminId: string;

  @Column({ name: 'impersonated_user_id', type: 'uuid' })
  impersonatedUserId: string;

  @Column({ name: 'started_at', type: 'timestamptz', default: () => 'now()' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}


