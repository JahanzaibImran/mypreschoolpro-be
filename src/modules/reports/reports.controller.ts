import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
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
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import { Report as ReportEntity } from './entities/report.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ReportResponseDto> {
    const report = await this.reportsService.create(createReportDto, user.id);
    return this.mapToResponseDto(report);
  }

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Get all reports' })
  @ApiQuery({ name: 'schoolId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of reports',
    type: [ReportResponseDto],
  })
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<ReportResponseDto[]> {
    const { reports } = await this.reportsService.findAll(user!, {
      schoolId,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
      offset: offset ? parseInt(offset.toString(), 10) : undefined,
    });
    return reports.map(report => this.mapToResponseDto(report));
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report found',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ReportResponseDto> {
    const report = await this.reportsService.findOne(id, user);
    return this.mapToResponseDto(report);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Update a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report updated successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReportDto: UpdateReportDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ReportResponseDto> {
    const report = await this.reportsService.update(id, updateReportDto, user);
    return this.mapToResponseDto(report);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Delete a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    await this.reportsService.remove(id, user);
    return { message: 'Report deleted successfully' };
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(report: ReportEntity): ReportResponseDto {
    return {
      id: report.id,
      schoolId: report.schoolId,
      createdBy: report.createdBy,
      reportName: report.reportName,
      reportType: report.reportType,
      fileName: report.fileName,
      fileSize: report.fileSize,
      dateRangeStart: report.dateRangeStart?.toISOString().split('T')[0] || null,
      dateRangeEnd: report.dateRangeEnd?.toISOString().split('T')[0] || null,
      metadata: report.metadata,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }
}

