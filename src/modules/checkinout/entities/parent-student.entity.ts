import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { ProfileEntity } from '../../users/entities/profile.entity';

@Entity('parent_students')
export class ParentStudent {
  @PrimaryColumn({ name: 'parent_id', type: 'uuid' })
  parentId: string;

  @PrimaryColumn({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar', length: 50, default: 'parent' })
  relationship: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ProfileEntity)
  @JoinColumn({ name: 'parent_id' })
  parent: ProfileEntity;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}

