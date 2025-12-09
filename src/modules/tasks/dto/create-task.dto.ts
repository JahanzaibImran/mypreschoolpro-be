import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { TaskPriorityType } from '../../../common/enums/task-priority-type.enum';
import { TaskStatusType } from '../../../common/enums/task-status-type.enum';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Review enrollment applications',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Review and process pending enrollment applications for next semester',
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: TaskPriorityType,
    default: TaskPriorityType.MEDIUM,
    example: TaskPriorityType.HIGH,
  })
  @IsEnum(TaskPriorityType)
  @IsOptional()
  priority?: TaskPriorityType;

  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatusType,
    default: TaskStatusType.PENDING,
    example: TaskStatusType.PENDING,
  })
  @IsEnum(TaskStatusType)
  @IsOptional()
  status?: TaskStatusType;

  @ApiPropertyOptional({
    description: 'Due date (ISO 8601 date string)',
    example: '2024-03-15T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @ApiPropertyOptional({
    description: 'User ID to assign the task to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  assignedTo?: string | null;

  @ApiPropertyOptional({
    description: 'School ID associated with the task',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  schoolId?: string | null;
}







