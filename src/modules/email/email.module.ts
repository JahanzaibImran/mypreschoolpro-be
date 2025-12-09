import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLog } from './entities/email-log.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailAutomationRule } from './entities/email-automation-rule.entity';
import { EmailConfiguration } from './entities/email-configuration.entity';
import { EmailPreference } from './entities/email-preference.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { EmailConfigurationService } from './email-configuration.service';
import { EmailConfigurationController } from './email-configuration.controller';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateController } from './email-template.controller';
import { EmailAutomationRuleService } from './email-automation-rule.service';
import { EmailAutomationRuleController } from './email-automation-rule.controller';
import { EmailLogController } from './email-log.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailLog,
      EmailTemplate,
      EmailAutomationRule,
      EmailConfiguration,
      EmailPreference,
      SchoolEntity,
    ]),
  ],
  controllers: [
    EmailConfigurationController,
    EmailTemplateController,
    EmailAutomationRuleController,
    EmailLogController,
  ],
  providers: [
    EmailConfigurationService,
    EmailTemplateService,
    EmailAutomationRuleService,
  ],
  exports: [
    EmailConfigurationService,
    EmailTemplateService,
    EmailAutomationRuleService,
  ],
})
export class EmailModule {}
