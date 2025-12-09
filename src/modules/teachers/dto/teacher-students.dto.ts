import { ApiProperty } from '@nestjs/swagger';

export class TeacherStudentLeadDto {
  @ApiProperty({ example: 'John Doe' })
  child_name: string;

  @ApiProperty({ example: 'Jane Doe' })
  parent_name: string;

  @ApiProperty({ example: 'jane@example.com' })
  parent_email: string;

  @ApiProperty({ example: '555-1234', nullable: true })
  parent_phone: string | null;

  @ApiProperty({ example: '2020-01-15', nullable: true })
  child_birthdate: string | null;
}

export class TeacherStudentClassDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Pre-K Morning Class' })
  name: string;
}

export class TeacherStudentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  lead_id: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'Pre-K' })
  program: string;

  @ApiProperty({ example: '2024-01-15', nullable: true })
  start_date: string | null;

  @ApiProperty({ example: 85 })
  attendance_rate: number;

  @ApiProperty({ example: 75 })
  progress_percentage: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  class_id: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  school_id: string;

  @ApiProperty({ type: TeacherStudentLeadDto })
  leads: TeacherStudentLeadDto;

  @ApiProperty({ type: TeacherStudentClassDto, nullable: true })
  classes: TeacherStudentClassDto | null;
}

export class TeacherStudentsResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  school_id: string;

  @ApiProperty({ type: [TeacherStudentResponseDto] })
  students: TeacherStudentResponseDto[];
}

