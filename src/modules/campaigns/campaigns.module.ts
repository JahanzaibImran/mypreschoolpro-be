import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignMessage } from './entities/campaign-message.entity';
import { CampaignAuditLog } from './entities/campaign-audit-log.entity';
import { CampaignAutomation } from './entities/campaign-automation.entity';
import { CampaignDeliveryLog } from './entities/campaign-delivery-log.entity';
import { CampaignErrorLog } from './entities/campaign-error-log.entity';
import { CampaignQueue } from './entities/campaign-queue.entity';
import { CampaignRecipient } from './entities/campaign-recipient.entity';
import { CampaignResult } from './entities/campaign-result.entity';
import { CampaignSegment } from './entities/campaign-segment.entity';
import { CampaignScheduleConfig } from './entities/campaign-schedule-config.entity';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

import { SchoolEntity } from '../schools/entities/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignMessage,
      CampaignAuditLog,
      CampaignAutomation,
      CampaignDeliveryLog,
      CampaignErrorLog,
      CampaignQueue,
      CampaignRecipient,
      CampaignResult,
      CampaignSegment,
      CampaignScheduleConfig,
      SchoolEntity,
    ]),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule { }
