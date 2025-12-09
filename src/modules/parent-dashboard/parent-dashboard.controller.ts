import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParentDashboardService } from './parent-dashboard.service';
import { ParentDashboardSummaryDto } from './dto/parent-dashboard-summary.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ParentChildDto, ParentDailyReportDto, SendParentMessageDto, ParentAttendanceDto, ParentProgressDto, ParentMediaDto } from './dto/parent-children.dto';
import { ParentInvoiceDto } from './dto/parent-dashboard-summary.dto';
import { Query } from '@nestjs/common';

@ApiTags('Parent Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parent/dashboard')
export class ParentDashboardController {
  constructor(private readonly parentDashboardService: ParentDashboardService) {}

  @Get('summary')
  @Roles(AppRole.PARENT)
  @ApiOperation({
    summary: 'Get parent dashboard summary',
    description: 'Returns waitlist, payments, and messages for the authenticated parent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Parent dashboard summary retrieved successfully',
    type: ParentDashboardSummaryDto,
  })
  async getSummary(@CurrentUser() user: AuthUser): Promise<ParentDashboardSummaryDto> {
    return this.parentDashboardService.getSummary(user);
  }

  @Get('children')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'List children for the authenticated parent' })
  @ApiResponse({ status: 200, type: [ParentChildDto] })
  async getChildren(@CurrentUser() user: AuthUser): Promise<ParentChildDto[]> {
    return this.parentDashboardService.getChildren(user);
  }

  @Post('children/:leadId/messages')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Send a message to the assigned teacher for a child' })
  @ApiResponse({ status: 201, description: 'Message queued successfully' })
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('leadId') leadId: string,
    @Body() dto: SendParentMessageDto,
  ): Promise<void> {
    return this.parentDashboardService.sendMessage(user, leadId, dto);
  }

  @Get('children/:leadId/reports')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Fetch recent daily reports for a child' })
  @ApiResponse({ status: 200, type: [ParentDailyReportDto] })
  async getReports(
    @CurrentUser() user: AuthUser,
    @Param('leadId') leadId: string,
  ): Promise<ParentDailyReportDto[]> {
    return this.parentDashboardService.getChildReports(user, leadId);
  }

  @Get('attendance')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Fetch attendance records for all children' })
  @ApiResponse({ status: 200, type: [ParentAttendanceDto] })
  async getAttendance(@CurrentUser() user: AuthUser): Promise<ParentAttendanceDto[]> {
    return this.parentDashboardService.getAttendance(user);
  }

  @Get('progress')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Fetch progress records for all children' })
  @ApiResponse({ status: 200, type: [ParentProgressDto] })
  async getProgress(@CurrentUser() user: AuthUser): Promise<ParentProgressDto[]> {
    return this.parentDashboardService.getProgress(user);
  }

  @Get('invoices')
  @Roles(AppRole.PARENT)
  @ApiOperation({
    summary: 'Fetch all invoices for the authenticated parent',
    description: 'Returns both standard invoices and lead invoices for the parent, combined and sorted by creation date.',
  })
  @ApiResponse({ status: 200, type: [ParentInvoiceDto] })
  async getInvoices(
    @CurrentUser() user: AuthUser,
    @Query('schoolId') schoolId?: string,
    @Query('limit') limit?: number,
  ): Promise<ParentInvoiceDto[]> {
    return this.parentDashboardService.getInvoices(user, schoolId, limit ? parseInt(limit.toString(), 10) : 50);
  }

  @Get('media')
  @Roles(AppRole.PARENT)
  @ApiOperation({
    summary: 'Fetch all media for the authenticated parent\'s children',
    description: 'Returns all media files (images, videos) associated with the parent\'s children.',
  })
  @ApiResponse({ status: 200, type: [ParentMediaDto] })
  async getMedia(@CurrentUser() user: AuthUser): Promise<ParentMediaDto[]> {
    return this.parentDashboardService.getMedia(user);
  }

  @Get('reports')
  @Roles(AppRole.PARENT)
  @ApiOperation({
    summary: 'Fetch all daily reports for the authenticated parent\'s children',
    description: 'Returns all daily reports for all children of the parent in a single call, avoiding multiple sequential requests.',
  })
  @ApiResponse({ status: 200, type: [ParentDailyReportDto] })
  async getAllReports(@CurrentUser() user: AuthUser): Promise<Array<ParentDailyReportDto & { leadId: string; childName: string }>> {
    return this.parentDashboardService.getAllChildrenReports(user);
  }
}


