import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum TeacherScheduleEventType {
  LESSON = 'lesson',
  ACTIVITY = 'activity',
  MEAL = 'meal',
  NAP = 'nap',
  OUTDOOR = 'outdoor',
  SPECIAL = 'special',
  MEETING = 'meeting',
}

@Entity('teacher_schedule_events')
export class TeacherScheduleEvent extends BaseEntity {
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'event_date', type: 'date' })
  eventDate: Date;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: TeacherScheduleEventType,
  })
  eventType: TeacherScheduleEventType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: false })
  recurring: boolean;
}


