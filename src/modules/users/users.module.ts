import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ProfileEntity } from './entities/profile.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { UserActivity } from './entities/user-activity.entity';
import { StaffInvitation } from './entities/staff-invitation.entity';
import { ImpersonationSession } from './entities/impersonation-session.entity';
import { StaffAssignmentRotation } from './entities/staff-assignment-rotation.entity';
import { StaffDocument } from './entities/staff-document.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { S3Service } from '../media/s3.service';
import s3Config from '../../config/s3.config';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProfileEntity,
      UserRoleEntity,
      UserActivity,
      StaffInvitation,
      ImpersonationSession,
      StaffAssignmentRotation,
      StaffDocument,
      SchoolEntity,
    ]),
    ConfigModule.forFeature(s3Config),
    MailerModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, S3Service],
  exports: [UsersService],
})
export class UsersModule {}
