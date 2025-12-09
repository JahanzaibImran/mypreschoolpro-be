import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { SchoolEntity } from '../schools/entities/school.entity';
import { ProfileEntity } from '../users/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, SchoolEntity, ProfileEntity]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}


