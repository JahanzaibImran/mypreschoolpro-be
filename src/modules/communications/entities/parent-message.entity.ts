import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Student } from '../../students/entities/student.entity';

export enum ParentMessageType {
  GENERAL = 'general',
  PROGRESS = 'progress',
  BEHAVIOR = 'behavior',
  ATTENDANCE = 'attendance',
}

@Entity('parent_messages')
export class ParentMessage extends BaseEntity {
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @Column({ name: 'parent_id', type: 'uuid' })
  parentId: string;

  @Column({ name: 'student_id', type: 'uuid', nullable: true })
  studentId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'sent_by_teacher', type: 'boolean', default: true })
  sentByTeacher: boolean;

  @Column({
    name: 'message_type',
    type: 'enum',
    enum: ParentMessageType,
    default: ParentMessageType.GENERAL,
  })
  messageType: ParentMessageType;

  // Relations
  @ManyToOne(() => Student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'student_id' })
  student: Student | null;
}


