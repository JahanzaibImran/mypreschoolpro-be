import { ApiProperty } from '@nestjs/swagger';

export class WaitlistLeadDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  childName: string;

  @ApiProperty()
  parentName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  program: string;

  @ApiProperty()
  school: string;

  @ApiProperty()
  schoolId: string;

  @ApiProperty()
  position: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  priorityScore: number;

  @ApiProperty()
  dateAdded: string;

  @ApiProperty()
  lastUpdated: string;

  @ApiProperty()
  siblingEnrolled: boolean;

  @ApiProperty()
  notes: string;
}

export class WaitlistSchoolDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalWaitlist: number;

  @ApiProperty({ type: () => [ProgramBreakdownDto] })
  programBreakdown: ProgramBreakdownDto[];
}

class ProgramBreakdownDto {
  @ApiProperty()
  program: string;

  @ApiProperty()
  count: number;
}

export class WaitlistStatsDto {
  @ApiProperty()
  totalWaitlisted: number;

  @ApiProperty()
  totalSchools: number;

  @ApiProperty()
  avgWaitTime: string;

  @ApiProperty()
  conversionRate: string;
}

export class WaitlistPaginationDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class WaitlistResponseDto {
  @ApiProperty({ type: () => [WaitlistLeadDto] })
  waitlist: WaitlistLeadDto[];

  @ApiProperty({ type: () => [WaitlistSchoolDto] })
  schools: WaitlistSchoolDto[];

  @ApiProperty({ type: () => WaitlistStatsDto })
  stats: WaitlistStatsDto;

  @ApiProperty({ type: () => WaitlistPaginationDto })
  pagination: WaitlistPaginationDto;
}











