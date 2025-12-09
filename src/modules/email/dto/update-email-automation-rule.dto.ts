import { PartialType } from '@nestjs/swagger';
import { CreateEmailAutomationRuleDto } from './create-email-automation-rule.dto';

export class UpdateEmailAutomationRuleDto extends PartialType(CreateEmailAutomationRuleDto) {}








