import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum DailyReportStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  SUBMITTED = 'submitted',
  PUBLISHED = 'published',
}

@Entity('daily_reports')
export class DailyReport extends BaseEntity {
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'student_id', type: 'uuid', nullable: true })
  studentId: string | null;

  @Column({ name: 'report_date', type: 'date' })
  reportDate: Date;

  @Column({ name: 'student_names', type: 'text', array: true, default: [] })
  studentNames: string[];

  @Column({ type: 'text', nullable: true })
  activities: string | null;

  @Column({ type: 'text', nullable: true })
  meals: string | null;

  @Column({ name: 'nap_time', type: 'text', nullable: true })
  napTime: string | null;

  @Column({ name: 'mood_behavior', type: 'text', nullable: true })
  moodBehavior: string | null;

  @Column({ type: 'text', nullable: true })
  milestones: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: DailyReportStatus,
    default: DailyReportStatus.DRAFT,
  })
  status: DailyReportStatus;
}


