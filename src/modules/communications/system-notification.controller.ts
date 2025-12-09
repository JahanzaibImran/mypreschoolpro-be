import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SystemNotificationService } from './system-notification.service';
import { CreateSystemNotificationDto } from './dto/create-system-notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Notification } from './entities/notification.entity';

@ApiTags('System Notifications')
@Controller('system-notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SystemNotificationController {
  constructor(
    private readonly systemNotificationService: SystemNotificationService,
  ) {}

  @Get()
  @Roles(AppRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all system notifications',
    description: 'Retrieve all system notifications (super admin only)',
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
    type: [Notification],
  })
  async findAll(@Query('limit') limit?: number): Promise<Notification[]> {
    return this.systemNotificationService.findAll(limit ? parseInt(limit.toString(), 10) : 50);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new system notification',
    description: 'Create a new system notification (super admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: Notification,
  })
  async create(
    @Body() createDto: CreateSystemNotificationDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Notification> {
    return this.systemNotificationService.create(createDto, user.id);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a system notification',
    description: 'Delete a system notification by ID (super admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Notification deleted successfully',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.systemNotificationService.remove(id);
  }
}










