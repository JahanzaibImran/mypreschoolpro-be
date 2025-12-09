import { IsOptional, IsString, Matches } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^([0-9a-fA-F-]{36}|all)$/i, {
    message: 'schoolId must be a UUID or the string "all"',
  })
  schoolId?: string;
}






