import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyReport } from './entities/daily-report.entity';
import { LessonPlan } from './entities/lesson-plan.entity';
import { StudentSkillProgress } from './entities/student-skill-progress.entity';
import { TeacherActivity } from './entities/teacher-activity.entity';
import { TeacherScheduleEvent } from './entities/teacher-schedule-event.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { LeadEntity } from '../leads/entities/lead.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { StudentAttendance } from '../students/entities/student-attendance.entity';
import { StudentProgress } from '../students/entities/student-progress.entity';
import { Media } from '../media/entities/media.entity';
import { LeadInteraction } from '../leads/entities/lead-interaction.entity';
import { LeadWorkflowNotification } from '../leads/entities/lead-workflow-notification.entity';
import { MediaModule } from '../media/media.module';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyReport,
      LessonPlan,
      StudentSkillProgress,
      TeacherActivity,
      TeacherScheduleEvent,
      ClassEntity,
      EnrollmentEntity,
      LeadEntity,
      UserRoleEntity,
      ProfileEntity,
      StudentAttendance,
      StudentProgress,
      Media,
      LeadInteraction,
      LeadWorkflowNotification,
    ]),
    MediaModule,
  ],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}


