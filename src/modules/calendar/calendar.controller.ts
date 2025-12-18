import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEventResponseDto } from './dto/calendar-event-response.dto';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('events')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.TEACHER, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Create a calendar event',
    description: 'Create a school-wide or classroom-specific calendar event',
  })
  @ApiResponse({
    status: 201,
    description: 'Calendar event created successfully',
    type: CalendarEventResponseDto,
  })
  async createEvent(
    @Body() dto: CreateCalendarEventDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CalendarEventResponseDto> {
    const schoolId = user.roles.find((r) => r.schoolId)?.schoolId;
    if (!schoolId) {
      throw new BadRequestException('User must be associated with a school to create calendar events');
    }

    return this.calendarService.createEvent(
      dto,
      user.id,
      user.roles.map((r) => r.role),
      schoolId,
    );
  }

  @Get('events')
  @Roles(
    AppRole.SCHOOL_ADMIN,
    AppRole.SCHOOL_OWNER,
    AppRole.TEACHER,
    AppRole.ADMISSIONS_STAFF,
    AppRole.PARENT,
  )
  @ApiOperation({
    summary: 'Get calendar events',
    description: 'Get calendar events with optional filters. Parents see events for their children\'s classes.',
  })
  @ApiQuery({ name: 'schoolId', required: true, description: 'School ID' })
  @ApiQuery({ name: 'classId', required: false, description: 'Class ID (optional)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Calendar events retrieved successfully',
    type: [CalendarEventResponseDto],
  })
  async getEvents(
    @Query('schoolId') schoolId: string,
    @CurrentUser() user: AuthUser,
    @Query('classId') classId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<CalendarEventResponseDto[]> {
    return this.calendarService.getEvents(
      schoolId,
      classId,
      startDate,
      endDate,
      user.id,
      user.primaryRole,
    );
  }

  @Get('events/:id')
  @Roles(
    AppRole.SCHOOL_ADMIN,
    AppRole.SCHOOL_OWNER,
    AppRole.TEACHER,
    AppRole.ADMISSIONS_STAFF,
    AppRole.PARENT,
  )
  @ApiOperation({
    summary: 'Get calendar event by ID',
    description: 'Get a specific calendar event by its ID',
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Calendar event retrieved successfully',
    type: CalendarEventResponseDto,
  })
  async getEventById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<CalendarEventResponseDto> {
    return this.calendarService.getEventById(id, user.id, user.primaryRole);
  }

  @Put('events/:id')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.TEACHER, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Update calendar event',
    description: 'Update an existing calendar event',
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Calendar event updated successfully',
    type: CalendarEventResponseDto,
  })
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CalendarEventResponseDto> {
    const schoolId = user.roles.find((r) => r.schoolId)?.schoolId;
    if (!schoolId) {
      throw new BadRequestException('User must be associated with a school');
    }

    return this.calendarService.updateEvent(
      id,
      dto,
      user.id,
      user.roles.map((r) => r.role),
      schoolId,
    );
  }

  @Delete('events/:id')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.TEACHER, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Delete calendar event',
    description: 'Delete a calendar event',
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Calendar event deleted successfully',
  })
  async deleteEvent(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean; message: string }> {
    const schoolId = user.roles.find((r) => r.schoolId)?.schoolId;
    if (!schoolId) {
      throw new BadRequestException('User must be associated with a school');
    }

    await this.calendarService.deleteEvent(
      id,
      user.id,
      user.roles.map((r) => r.role),
      schoolId,
    );

    return { success: true, message: 'Calendar event deleted successfully' };
  }
}

