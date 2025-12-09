import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { EnrollmentEntity } from '../../enrollment/entities/enrollment.entity';

export enum ClassStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  FULL = 'full',
}

@Entity('classes')
export class ClassEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'school_id', nullable: false })
  schoolId: string;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'uuid', name: 'teacher_id', nullable: true })
  teacherId: string | null;

  @Column({ type: 'text', nullable: true })
  program: string | null;

  @Column({ type: 'date', name: 'start_date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate: Date | null;

  @Column({ type: 'int', name: 'capacity', nullable: true, default: 20 })
  capacity: number | null;

  @Column({ type: 'int', name: 'current_enrollment', nullable: true, default: 0 })
  currentEnrollment: number | null;

  @Column({ type: 'text', name: 'age_group', nullable: true })
  ageGroup: string | null;

  @Column({
    type: 'enum',
    enum: ClassStatus,
    name: 'enrollment_status',
    default: ClassStatus.OPEN,
  })
  status: ClassStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.class)
  enrollments: EnrollmentEntity[];
}

