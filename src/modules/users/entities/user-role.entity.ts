import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppRole } from '../../../common/enums/app-role.enum';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProfileEntity } from './profile.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

@Entity('user_roles')
export class UserRoleEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: AppRole })
  role: AppRole;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @ManyToOne(() => ProfileEntity, (profile) => profile.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  profile: ProfileEntity;

  @ManyToOne(() => SchoolEntity, (school) => school.userRoles, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity | null;
}


