import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { SchoolEntity } from './entities/school.entity';
import { SchoolAnalytics } from './entities/school-analytics.entity';
import { ZipCodeDemographics } from './entities/zip-code-demographics.entity';
import { SchoolPayment } from './entities/school-payment.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { Waitlist } from '../enrollment/entities/waitlist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolEntity,
      SchoolAnalytics,
      ZipCodeDemographics,
      SchoolPayment,
      ClassEntity,
      EnrollmentEntity,
      Waitlist,
    ]),
  ],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
