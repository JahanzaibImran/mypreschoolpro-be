import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { SchoolEntity } from '../schools/entities/school.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { LeadEntity } from '../leads/entities/lead.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { StaffDocument } from '../users/entities/staff-document.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import openaiConfig from '../../config/openai.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolEntity,
      EnrollmentEntity,
      Transaction,
      LeadEntity,
      ClassEntity,
      Invoice,
      Payment,
      StaffDocument,
      UserRoleEntity,
      ProfileEntity,
    ]),
    ConfigModule.forFeature(openaiConfig),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
