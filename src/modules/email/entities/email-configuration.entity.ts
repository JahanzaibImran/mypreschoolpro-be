import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

@Entity('email_configurations')
export class EmailConfiguration extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'from_email', type: 'text' })
  fromEmail: string;

  @Column({ name: 'from_name', type: 'text' })
  fromName: string;

  @Column({ name: 'reply_to_email', type: 'text', nullable: true })
  replyToEmail: string | null;

  @Column({ name: 'smtp_provider', type: 'text', default: 'resend' })
  smtpProvider: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  // Relations
  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


