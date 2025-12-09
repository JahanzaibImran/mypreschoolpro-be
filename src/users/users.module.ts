import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { UserRole } from './entities/user-role.entity';
import { School } from './entities/school.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile, UserRole, School])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}







