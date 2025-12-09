import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { AppRole } from '../../../common/enums/app-role.enum';

@Entity('staff_invitations')
export class StaffInvitation extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'invited_email', type: 'varchar', length: 255 })
  invitedEmail: string;

  @Column({
    name: 'invited_role',
    type: 'enum',
    enum: AppRole,
  })
  invitedRole: AppRole;

  @Column({ name: 'invited_by', type: 'uuid' })
  invitedBy: string;

  @Column({ name: 'invitation_token', type: 'varchar', length: 255, unique: true })
  invitationToken: string;

  @Column({ name: 'expires_at', type: 'timestamptz', default: () => "now() + interval '7 days'" })
  expiresAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  // Relations
  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


