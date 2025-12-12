import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsEmail, IsOptional } from 'class-validator';

export class UpdateEmailSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  smtp_host?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  smtp_port?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  smtp_username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  smtp_password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  from_email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  from_name?: string;
}

export class EmailSettingsResponseDto {
  @ApiProperty()
  smtp_host: string;

  @ApiProperty()
  smtp_port: number;

  @ApiProperty()
  smtp_username: string;

  @ApiProperty()
  from_email: string;

  @ApiProperty()
  from_name: string;
}





