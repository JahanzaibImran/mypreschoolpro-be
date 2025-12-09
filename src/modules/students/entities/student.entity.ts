import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { ClassEntity } from '../../classes/entities/class.entity';

@Entity('students')
export class Student extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 255 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dob: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  program: string | null;

  @Column({ name: 'teacher_id', type: 'uuid', nullable: true })
  teacherId: string | null;

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId: string | null;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'parent_email', type: 'varchar', length: 255, nullable: true })
  parentEmail: string | null;

  @Column({ name: 'attendance_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  attendanceRate: number;

  // Relations
  @ManyToOne(() => SchoolEntity)
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;

  @ManyToOne(() => ClassEntity, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity | null;
}


