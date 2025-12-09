import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('student_skill_progress')
export class StudentSkillProgress extends BaseEntity {
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @Column({ name: 'skill_area', type: 'varchar', length: 255 })
  skillArea: string;

  @Column({ name: 'skill_name', type: 'varchar', length: 255 })
  skillName: string;

  @Column({ name: 'current_level', type: 'integer' })
  currentLevel: number;

  @Column({ name: 'target_level', type: 'integer' })
  targetLevel: number;

  @Column({ type: 'text' })
  observation: string;

  @Column({ name: 'milestone_achieved', type: 'boolean', default: false })
  milestoneAchieved: boolean;

  @Column({ name: 'recorded_date', type: 'date', default: () => 'CURRENT_DATE' })
  recordedDate: Date;

  @Column({ name: 'next_steps', type: 'text', nullable: true })
  nextSteps: string | null;
}










