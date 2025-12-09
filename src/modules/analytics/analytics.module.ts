import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SchoolEntity } from '../schools/entities/school.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { LeadEntity } from '../leads/entities/lead.entity';
import { Waitlist } from '../enrollment/entities/waitlist.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { CampaignRecipient } from '../campaigns/entities/campaign-recipient.entity';
import openaiConfig from '../../config/openai.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolEntity,
      EnrollmentEntity,
      Transaction,
      LeadEntity,
      Waitlist,
      Campaign,
      CampaignRecipient,
    ]),
    ConfigModule.forFeature(openaiConfig),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
