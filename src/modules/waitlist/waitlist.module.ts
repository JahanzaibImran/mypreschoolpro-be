import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { Waitlist } from '../enrollment/entities/waitlist.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { SchoolEntity } from '../schools/entities/school.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Waitlist, EnrollmentEntity, SchoolEntity])],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}


