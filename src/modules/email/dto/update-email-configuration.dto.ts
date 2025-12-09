import { PartialType } from '@nestjs/swagger';
import { CreateEmailConfigurationDto } from './create-email-configuration.dto';

export class UpdateEmailConfigurationDto extends PartialType(CreateEmailConfigurationDto) {}








