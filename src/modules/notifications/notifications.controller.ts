import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PaymentReminderService } from '../communications/payment-reminder.service';
import { SendPaymentReminderDto } from '../communications/dto/send-payment-reminder.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly paymentReminderService: PaymentReminderService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Returns notifications for the authenticated user from both lead_notifications and lead_workflow_notifications tables',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of notifications to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              user_id: { type: 'string', nullable: true },
              notification_type: { type: 'string' },
              title: { type: 'string' },
              message: { type: 'string' },
              is_read: { type: 'boolean' },
              sent_via_email: { type: 'boolean' },
              created_at: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getNotifications(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: number,
  ) {
    if (!user.email) {
      throw new Error('User email is required');
    }

    const notifications = await this.notificationsService.getUserNotifications(
      user.id,
      user.email,
      limit ? parseInt(limit.toString(), 10) : 50,
    );

    return {
      success: true,
      data: notifications,
    };
  }

  @Get('workflow')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get lead workflow notifications for a school',
    description:
      'Returns workflow notifications from lead_workflow_notifications table, optionally filtered by school.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'Filter by school ID (admin/staff are restricted to their own school)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of notifications to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow notifications retrieved successfully',
  })
  async getWorkflowNotifications(
    @CurrentUser() user: AuthUser,
    @Query('schoolId') schoolId?: string,
    @Query('limit') limit?: number,
  ) {
    const notifications = await this.notificationsService.getWorkflowNotificationsForSchool(
      user,
      schoolId,
      limit ? parseInt(limit.toString(), 10) : 50,
    );

    return {
      success: true,
      data: notifications,
    };
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Returns the count of unread notifications for the authenticated user from both tables',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  async getUnreadCount(@CurrentUser() user: AuthUser) {
    if (!user.email) {
      throw new Error('User email is required');
    }

    const count = await this.notificationsService.getUnreadCount(user.id, user.email);

    return {
      success: true,
      data: { count },
    };
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
  })
  async markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.markAsRead(notificationId, user.id);

    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all notifications as read for the authenticated user in both tables',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
  })
  async markAllAsRead(@CurrentUser() user: AuthUser) {
    if (!user.email) {
      throw new Error('User email is required');
    }

    await this.notificationsService.markAllAsRead(user.id, user.email);

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a notification',
    description: 'Deletes a notification from either lead_notifications or lead_workflow_notifications table',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  async deleteNotification(
    @CurrentUser() user: AuthUser,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.deleteNotification(notificationId, user.id);

    return {
      success: true,
      message: 'Notification deleted',
    };
  }

  @Post('send-payment-reminder')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send payment reminder',
    description: 'Send payment reminders to parents or school owners using notification templates',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment reminders sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        notificationsSent: { type: 'number' },
      },
    },
  })
  async sendPaymentReminder(
    @Body() dto: SendPaymentReminderDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean; notificationsSent: number }> {
    return this.paymentReminderService.sendPaymentReminder(dto, user);
  }
}

