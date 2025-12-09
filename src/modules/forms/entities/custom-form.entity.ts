import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';
import { FormStatus } from '../../../common/enums/form-status.enum';
import { CustomFormField } from './custom-form-field.entity';
import { CustomFormSubmission } from './custom-form-submission.entity';

@Entity('custom_forms')
export class CustomForm extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ name: 'form_name', type: 'varchar', length: 255 })
  formName: string;

  @Column({ name: 'form_description', type: 'text', nullable: true })
  formDescription: string | null;

  @Column({ name: 'form_type', type: 'varchar', length: 100 })
  formType: string;

  @Column({
    type: 'enum',
    enum: FormStatus,
    default: FormStatus.DRAFT,
  })
  status: FormStatus;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  // Relations
  @ManyToOne(() => SchoolEntity, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity | null;

  @OneToMany(() => CustomFormField, (field) => field.form)
  fields: CustomFormField[];

  @OneToMany(() => CustomFormSubmission, (submission) => submission.form)
  submissions: CustomFormSubmission[];
}


