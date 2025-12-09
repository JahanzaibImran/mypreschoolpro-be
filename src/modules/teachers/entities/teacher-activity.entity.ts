import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ActivityStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  SHARED = 'shared',
}

@Entity('teacher_activities')
export class TeacherActivity extends BaseEntity {
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'activity_type', type: 'varchar', length: 255 })
  activityType: string;

  @Column({ name: 'skill_areas', type: 'text', array: true, default: [] })
  skillAreas: string[];

  @Column({ name: 'learning_objectives', type: 'text', nullable: true })
  learningObjectives: string | null;

  @Column({ name: 'materials_used', type: 'text', array: true, default: [] })
  materialsUsed: string[];

  @Column({ type: 'text', nullable: true })
  reflection: string | null;

  @Column({ name: 'date_completed', type: 'date', default: () => 'CURRENT_DATE' })
  dateCompleted: Date;

  @Column({ type: 'integer', default: 30 })
  duration: number;

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.DRAFT,
  })
  status: ActivityStatus;
}










