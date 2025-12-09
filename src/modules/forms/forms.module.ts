import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomForm } from './entities/custom-form.entity';
import { CustomFormField } from './entities/custom-form-field.entity';
import { CustomFormSubmission } from './entities/custom-form-submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomForm, CustomFormField, CustomFormSubmission])],
  controllers: [],
  providers: [],
  exports: [],
})
export class FormsModule {}


