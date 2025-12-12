import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSystemSettingsDto, SystemSettingsResponseDto } from './dto/system-settings.dto';
import { UpdateEmailSettingsDto, EmailSettingsResponseDto } from './dto/email-settings.dto';
import { UpdateSecuritySettingsDto, SecuritySettingsResponseDto } from './dto/security-settings.dto';
import { UpdateNotificationSettingsDto, NotificationSettingsResponseDto } from './dto/notification-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.SUPER_ADMIN)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('system')
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({
    status: 200,
    description: 'System settings retrieved successfully',
    type: SystemSettingsResponseDto,
  })
  async getSystemSettings(): Promise<SystemSettingsResponseDto> {
    return this.settingsService.getSystemSettings();
  }

  @Put('system')
  @ApiOperation({ summary: 'Update system settings' })
  @ApiResponse({
    status: 200,
    description: 'System settings updated successfully',
    type: SystemSettingsResponseDto,
  })
  async updateSystemSettings(@Body() dto: UpdateSystemSettingsDto): Promise<SystemSettingsResponseDto> {
    return this.settingsService.updateSystemSettings(dto);
  }

  @Get('email')
  @ApiOperation({ summary: 'Get email settings' })
  @ApiResponse({
    status: 200,
    description: 'Email settings retrieved successfully',
    type: EmailSettingsResponseDto,
  })
  async getEmailSettings(): Promise<EmailSettingsResponseDto> {
    return this.settingsService.getEmailSettings();
  }

  @Put('email')
  @ApiOperation({ summary: 'Update email settings' })
  @ApiResponse({
    status: 200,
    description: 'Email settings updated successfully',
    type: EmailSettingsResponseDto,
  })
  async updateEmailSettings(@Body() dto: UpdateEmailSettingsDto): Promise<EmailSettingsResponseDto> {
    return this.settingsService.updateEmailSettings(dto);
  }

  @Get('security')
  @ApiOperation({ summary: 'Get security settings' })
  @ApiResponse({
    status: 200,
    description: 'Security settings retrieved successfully',
    type: SecuritySettingsResponseDto,
  })
  async getSecuritySettings(): Promise<SecuritySettingsResponseDto> {
    return this.settingsService.getSecuritySettings();
  }

  @Put('security')
  @ApiOperation({ summary: 'Update security settings' })
  @ApiResponse({
    status: 200,
    description: 'Security settings updated successfully',
    type: SecuritySettingsResponseDto,
  })
  async updateSecuritySettings(@Body() dto: UpdateSecuritySettingsDto): Promise<SecuritySettingsResponseDto> {
    return this.settingsService.updateSecuritySettings(dto);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({
    status: 200,
    description: 'Notification settings retrieved successfully',
    type: NotificationSettingsResponseDto,
  })
  async getNotificationSettings(): Promise<NotificationSettingsResponseDto> {
    return this.settingsService.getNotificationSettings();
  }

  @Put('notifications')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({
    status: 200,
    description: 'Notification settings updated successfully',
    type: NotificationSettingsResponseDto,
  })
  async updateNotificationSettings(@Body() dto: UpdateNotificationSettingsDto): Promise<NotificationSettingsResponseDto> {
    return this.settingsService.updateNotificationSettings(dto);
  }
}





