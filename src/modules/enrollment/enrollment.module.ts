import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentEntity } from './entities/enrollment.entity';
import { WaitlistAutomationConfig } from './entities/waitlist-automation-config.entity';
import { Waitlist } from './entities/waitlist.entity';
import { EnrollmentQueue } from './entities/enrollment-queue.entity';
import { EnrollmentPacketTracking } from './entities/enrollment-packet-tracking.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { LeadsModule } from '../leads/leads.module';
import { ClassesModule } from '../classes/classes.module';
import { MediaModule } from '../media/media.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnrollmentEntity,
      WaitlistAutomationConfig,
      Waitlist,
      EnrollmentQueue,
      EnrollmentPacketTracking,
      SchoolEntity,
    ]),
    LeadsModule,
    MediaModule,
    MailerModule,
    forwardRef(() => ClassesModule),
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
