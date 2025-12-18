import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IllnessLog } from './entities/illness-log.entity';
import { MedicationAuthorization } from './entities/medication-authorization.entity';
import { MedicationLog } from './entities/medication-log.entity';
import { Student } from '../students/entities/student.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { HealthService } from './health.service';
import { MedicationService } from './medication.service';
import { HealthController } from './health.controller';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IllnessLog,
      MedicationAuthorization,
      MedicationLog,
      Student,
      ProfileEntity,
      SchoolEntity,
    ]),
    CommunicationsModule,
  ],
  controllers: [HealthController],
  providers: [HealthService, MedicationService],
  exports: [HealthService, MedicationService],
})
export class HealthModule {}


