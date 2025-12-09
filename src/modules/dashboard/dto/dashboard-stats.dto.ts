import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty() totalStudents: number;
  @ApiProperty() activeClasses: number;
  @ApiProperty() totalLeads: number;
  @ApiProperty() recentEnrollments: number;
  @ApiProperty() unreadMessages: number;
  @ApiProperty() pendingPayments: number;
  @ApiProperty() monthlyRevenue: number;
  @ApiProperty() upcomingEvents: number;
}






