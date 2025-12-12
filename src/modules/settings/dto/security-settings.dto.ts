import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Min, IsArray, IsString, IsOptional } from 'class-validator';

export class UpdateSecuritySettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(4)
  password_min_length?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  require_2fa?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_login_attempts?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  lockout_duration_minutes?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_domains?: string[];
}

export class SecuritySettingsResponseDto {
  @ApiProperty()
  password_min_length: number;

  @ApiProperty()
  require_2fa: boolean;

  @ApiProperty()
  max_login_attempts: number;

  @ApiProperty()
  lockout_duration_minutes: number;

  @ApiProperty({ type: [String] })
  allowed_domains: string[];
}





