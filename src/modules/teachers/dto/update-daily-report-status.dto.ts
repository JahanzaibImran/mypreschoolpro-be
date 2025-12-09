import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DailyReportStatus } from '../entities/daily-report.entity';

export class UpdateDailyReportStatusDto {
  @ApiProperty({ 
    description: 'New status for the report', 
    enum: DailyReportStatus,
    example: DailyReportStatus.SENT
  })
  @IsEnum(DailyReportStatus)
  status: DailyReportStatus;
}


