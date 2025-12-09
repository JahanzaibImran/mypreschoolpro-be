import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CustomForm } from './custom-form.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

@Entity('custom_form_submissions')
export class CustomFormSubmission extends BaseEntity {
  @Column({ name: 'form_id', type: 'uuid' })
  formId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'submitted_by', type: 'uuid', nullable: true })
  submittedBy: string | null;

  @Column({ name: 'submission_data', type: 'jsonb', default: {} })
  submissionData: Record<string, any>;

  @Column({ name: 'submitted_at', type: 'timestamptz', default: () => 'now()' })
  submittedAt: Date;

  @Column({ name: 'submitter_email', type: 'varchar', length: 255, nullable: true })
  submitterEmail: string | null;

  @Column({ name: 'submitter_name', type: 'varchar', length: 255, nullable: true })
  submitterName: string | null;

  // Relations
  @ManyToOne(() => CustomForm, (form) => form.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'form_id' })
  form: CustomForm;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


