import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckInOutController } from './checkinout.controller';
import { CheckInOutService } from './checkinout.service';
import { AuthorizedPickupService } from './authorized-pickup.service';
import { CheckInOutRecord } from './entities/check-in-out-record.entity';
import { AuthorizedPickupPerson } from './entities/authorized-pickup-person.entity';
import { ParentStudent } from './entities/parent-student.entity';
import { Student } from '../students/entities/student.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { CommunicationsModule } from '../communications/communications.module';
import { MediaModule } from '../media/media.module';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { LeadEntity } from '../leads/entities/lead.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CheckInOutRecord,
      AuthorizedPickupPerson,
      ParentStudent,
      Student,
      SchoolEntity,
      ProfileEntity,
      UserRoleEntity,
      LeadEntity,
    ]),
    CommunicationsModule,
    MediaModule,
  ],
  controllers: [CheckInOutController],
  providers: [CheckInOutService, AuthorizedPickupService],
  exports: [CheckInOutService, AuthorizedPickupService],
})
export class CheckInOutModule {}

