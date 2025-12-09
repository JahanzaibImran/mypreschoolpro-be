import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Student } from '../students/entities/student.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { LeadEntity } from '../leads/entities/lead.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { Message } from '../communications/entities/message.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { Subscription } from '../payments/entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Student,
    ClassEntity,
    LeadEntity,
    EnrollmentEntity,
    Message,
    Transaction,
    ProfileEntity,
    SchoolEntity,
    Subscription,
  ])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}











