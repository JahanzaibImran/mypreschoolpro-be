import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentDocument } from './entities/student-document.entity';
import { StudentAttendance } from './entities/student-attendance.entity';
import { StudentProgress } from './entities/student-progress.entity';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { MediaModule } from '../media/media.module';
import { LeadsModule } from '../leads/leads.module';
import { LeadEntity } from '../leads/entities/lead.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { ProfileEntity } from '../users/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      StudentDocument,
      StudentAttendance,
      StudentProgress,
      LeadEntity,
      EnrollmentEntity,
      ClassEntity,
      UserRoleEntity,
      ProfileEntity,
    ]),
    MediaModule,
    LeadsModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule { }
