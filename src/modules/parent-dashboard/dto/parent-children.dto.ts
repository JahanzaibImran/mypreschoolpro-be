import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParentMessageType } from '../../communications/entities/parent-message.entity';

export class ParentChildEnrollmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  startDate: string | null;

  @ApiPropertyOptional()
  endDate: string | null;

  @ApiPropertyOptional()
  tuitionAmount: number | null;
}

export class ParentChildWaitlistDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  position: number | null;

  @ApiPropertyOptional()
  program: string | null;

  @ApiPropertyOptional()
  createdAt: string | null;
}

export class ParentChildProgressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  progressPercentage: number;

  @ApiPropertyOptional()
  teacherComments: string | null;

  @ApiPropertyOptional()
  assessmentDate: string | null;
}

export class ParentChildActivityDto {
  @ApiProperty()
  activityType: string;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiProperty()
  createdAt: string;
}

export class ParentChildDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  childName: string;

  @ApiPropertyOptional()
  childBirthdate: string | null;

  @ApiPropertyOptional()
  program: string | null;

  @ApiProperty()
  leadStatus: string;

  @ApiProperty()
  schoolId: string;

  @ApiPropertyOptional()
  schoolName: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional({ type: ParentChildEnrollmentDto })
  enrollment?: ParentChildEnrollmentDto | null;

  @ApiPropertyOptional({ type: ParentChildWaitlistDto })
  waitlist?: ParentChildWaitlistDto | null;

  @ApiPropertyOptional({ type: [ParentChildProgressDto] })
  progress?: ParentChildProgressDto[];

  @ApiPropertyOptional({ type: [ParentChildActivityDto] })
  recentActivities?: ParentChildActivityDto[];
}

export class ParentDailyReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reportDate: string;

  @ApiPropertyOptional()
  activities: string | null;

  @ApiPropertyOptional()
  meals: string | null;

  @ApiPropertyOptional()
  napTime: string | null;

  @ApiPropertyOptional()
  moodBehavior: string | null;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiPropertyOptional()
  leadId?: string;

  @ApiPropertyOptional()
  childName?: string;
}

export class SendParentMessageDto {
  @ApiProperty()
  subject: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional({ enum: ParentMessageType })
  messageType?: ParentMessageType;
}

export class ParentAttendanceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiProperty()
  studentId: string;

  @ApiPropertyOptional()
  leadId: string | null;

  @ApiPropertyOptional()
  teacherId: string | null;

  @ApiProperty()
  createdAt: string;
}

export class ParentProgressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  progressPercentage: number;

  @ApiPropertyOptional()
  grade: string | null;

  @ApiPropertyOptional()
  teacherComments: string | null;

  @ApiPropertyOptional()
  assessmentDate: string | null;

  @ApiProperty()
  studentId: string;

  @ApiPropertyOptional()
  leadId: string | null;

  @ApiProperty()
  createdAt: string;
}

export class ParentMediaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  childId: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileType: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  createdAt: string;
}




