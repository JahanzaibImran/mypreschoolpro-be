import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EmailType } from '../../../common/enums/email-type.enum';

@Entity('email_preferences')
export class EmailPreference extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({
    name: 'email_type',
    type: 'enum',
    enum: EmailType,
  })
  emailType: EmailType;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'varchar', length: 50, default: 'immediate' })
  frequency: string;
}


