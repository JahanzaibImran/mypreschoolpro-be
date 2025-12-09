import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CustomForm } from './custom-form.entity';
import { FormFieldType } from '../../../common/enums/form-field-type.enum';

@Entity('custom_form_fields')
export class CustomFormField extends BaseEntity {
  @Column({ name: 'form_id', type: 'uuid' })
  formId: string;

  @Column({ name: 'field_name', type: 'varchar', length: 100 })
  fieldName: string;

  @Column({ name: 'field_label', type: 'varchar', length: 255 })
  fieldLabel: string;

  @Column({
    type: 'enum',
    enum: FormFieldType,
  })
  fieldType: FormFieldType;

  @Column({ name: 'field_options', type: 'jsonb', default: [] })
  fieldOptions: any[];

  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ name: 'field_order', type: 'integer', default: 0 })
  fieldOrder: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  placeholder: string | null;

  @Column({ name: 'help_text', type: 'text', nullable: true })
  helpText: string | null;

  @Column({ name: 'validation_rules', type: 'jsonb', default: {} })
  validationRules: Record<string, any>;

  // Relations
  @ManyToOne(() => CustomForm, (form) => form.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'form_id' })
  form: CustomForm;
}


