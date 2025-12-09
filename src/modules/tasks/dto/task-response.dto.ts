import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriorityType } from '../../../common/enums/task-priority-type.enum';
import { TaskStatusType } from '../../../common/enums/task-status-type.enum';

export class TaskResponseDto {
  @ApiProperty({
    description: 'Task ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Task title',
    example: 'Review enrollment applications',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Review and process pending enrollment applications for next semester',
  })
  description: string | null;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriorityType,
    example: TaskPriorityType.HIGH,
  })
  priority: TaskPriorityType;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatusType,
    example: TaskStatusType.PENDING,
  })
  status: TaskStatusType;

  @ApiPropertyOptional({
    description: 'Due date',
    example: '2024-03-15T00:00:00Z',
  })
  dueDate: string | null;

  @ApiPropertyOptional({
    description: 'User ID assigned to the task',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  assignedTo: string | null;

  @ApiPropertyOptional({
    description: 'School ID associated with the task',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  schoolId: string | null;

  @ApiProperty({
    description: 'User ID who created the task',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-03-01T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-03-01T10:00:00Z',
  })
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'Assignee profile information',
  })
  assignee?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;

  @ApiPropertyOptional({
    description: 'School information',
  })
  school?: {
    id: string;
    name: string;
  } | null;
}







