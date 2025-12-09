import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentRegistrationController } from './parent-registration.controller';
import { ParentRegistrationService } from './parent-registration.service';
import { SchoolEntity } from '../schools/entities/school.entity';
import { LeadEntity } from '../leads/entities/lead.entity';
import { Waitlist } from '../enrollment/entities/waitlist.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { ConfigModule } from '@nestjs/config';
import { StudentDocument } from '../students/entities/student-document.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SchoolEntity, LeadEntity, Waitlist, Transaction, StudentDocument]),
  ],
  controllers: [ParentRegistrationController],
  providers: [ParentRegistrationService],
})
export class ParentRegistrationModule {}


