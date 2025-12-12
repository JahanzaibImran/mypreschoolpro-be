import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateSystemSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  maintenance_mode?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_schools_per_owner?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  default_trial_days?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allow_registrations?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  require_email_verification?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  session_timeout_hours?: number;
}

export class SystemSettingsResponseDto {
  @ApiProperty()
  maintenance_mode: boolean;

  @ApiProperty()
  max_schools_per_owner: number;

  @ApiProperty()
  default_trial_days: number;

  @ApiProperty()
  allow_registrations: boolean;

  @ApiProperty()
  require_email_verification: boolean;

  @ApiProperty()
  session_timeout_hours: number;
}





