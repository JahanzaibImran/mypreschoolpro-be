import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

export enum LessonPlanStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('lesson_plans')
export class LessonPlan extends BaseEntity {
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ name: 'lesson_date', type: 'date' })
  lessonDate: Date;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  objectives: string | null;

  @Column({ type: 'jsonb', default: [] })
  materials: any[];

  @Column({
    type: 'enum',
    enum: LessonPlanStatus,
    default: LessonPlanStatus.PLANNED,
  })
  status: LessonPlanStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  activities: string | null;

  @Column({ type: 'text', nullable: true })
  assessment: string | null;

  @Column({ type: 'integer', default: 60 })
  duration: number;

  @Column({ name: 'age_group', type: 'varchar', length: 100, nullable: true })
  ageGroup: string | null;

  // Relations
  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


