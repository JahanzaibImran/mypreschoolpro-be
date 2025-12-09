import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { NotificationPreferencesService, NotificationPreferencesDto } from './notification-preferences.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications/preferences')
export class NotificationPreferencesController {
  constructor(private readonly preferencesService: NotificationPreferencesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get notification preferences for the authenticated user',
    description: 'Returns the current user\'s notification preferences, or null if not set.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences retrieved successfully',
    schema: {
      type: 'object',
      nullable: true,
      properties: {
        id: { type: 'string', format: 'uuid' },
        email_enrollments: { type: 'boolean' },
        email_payments: { type: 'boolean' },
        email_staff_updates: { type: 'boolean' },
        email_marketing: { type: 'boolean' },
        sms_enrollments: { type: 'boolean' },
        sms_payments: { type: 'boolean' },
        sms_emergencies: { type: 'boolean' },
        push_notifications: { type: 'boolean' },
        weekly_reports: { type: 'boolean' },
        monthly_reports: { type: 'boolean' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPreferences(
    @CurrentUser() user: AuthUser,
  ): Promise<NotificationPreferencesDto | null> {
    return this.preferencesService.getPreferences(user.id);
  }

  @Put()
  @ApiOperation({
    summary: 'Update notification preferences for the authenticated user',
    description: 'Updates or creates notification preferences for the current user. Only provided fields will be updated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email_enrollments: { type: 'boolean' },
        email_payments: { type: 'boolean' },
        email_staff_updates: { type: 'boolean' },
        email_marketing: { type: 'boolean' },
        sms_enrollments: { type: 'boolean' },
        sms_payments: { type: 'boolean' },
        sms_emergencies: { type: 'boolean' },
        push_notifications: { type: 'boolean' },
        weekly_reports: { type: 'boolean' },
        monthly_reports: { type: 'boolean' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() preferences: Partial<NotificationPreferencesDto>,
  ): Promise<NotificationPreferencesDto> {
    return this.preferencesService.upsertPreferences(user.id, preferences);
  }
}

