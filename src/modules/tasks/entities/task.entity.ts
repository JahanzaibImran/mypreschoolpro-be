import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { TaskPriorityType } from '../../../common/enums/task-priority-type.enum';
import { TaskStatusType } from '../../../common/enums/task-status-type.enum';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: TaskPriorityType,
    default: TaskPriorityType.MEDIUM,
  })
  priority: TaskPriorityType;

  @Column({
    type: 'enum',
    enum: TaskStatusType,
    default: TaskStatusType.PENDING,
  })
  status: TaskStatusType;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  // Relations
  @ManyToOne(() => SchoolEntity, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity | null;
}


