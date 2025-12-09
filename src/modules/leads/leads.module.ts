import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadEntity } from './entities/lead.entity';
import { LeadActivity } from './entities/lead-activity.entity';
import { LeadAuditLog } from './entities/lead-audit-log.entity';
import { LeadAutomationRule } from './entities/lead-automation-rule.entity';
import { LeadInteraction } from './entities/lead-interaction.entity';
import { LeadInvoice } from './entities/lead-invoice.entity';
import { LeadInvoiceItem } from './entities/lead-invoice-item.entity';
import { LeadNotification } from './entities/lead-notification.entity';
import { LeadReminder } from './entities/lead-reminder.entity';
import { LeadScoringConfig } from './entities/lead-scoring-config.entity';
import { LeadWorkflowNotification } from './entities/lead-workflow-notification.entity';
import { LeadScoringRule } from './entities/lead-scoring-rule.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { Waitlist } from '../enrollment/entities/waitlist.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeadEntity,
      LeadActivity,
      LeadAuditLog,
      LeadAutomationRule,
      LeadInteraction,
      LeadInvoice,
      LeadInvoiceItem,
      LeadNotification,
      LeadReminder,
      LeadScoringConfig,
      LeadWorkflowNotification,
      LeadScoringRule,
      SchoolEntity,
      Waitlist,
      EnrollmentEntity,
      ClassEntity,
    ]),
    RealtimeModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
