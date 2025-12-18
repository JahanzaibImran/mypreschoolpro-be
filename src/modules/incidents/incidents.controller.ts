import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { AddFollowUpDto } from './dto/add-follow-up.dto';
import { IncidentFilterDto } from './dto/incident-filter.dto';
import { IncidentReport } from './entities/incident-report.entity';

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Create a new incident report' })
  @ApiResponse({ status: 201, description: 'Incident created successfully', type: IncidentReport })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createIncident(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<IncidentReport> {
    // Get user's school ID
    const schoolRole = user.roles.find((r) => r.schoolId);
    if (!schoolRole?.schoolId) {
      throw new BadRequestException('User must be associated with a school to create incident reports');
    }

    return this.incidentsService.createIncident(
      dto,
      user.id,
      user.roles.map((r) => r.role),
      schoolRole.schoolId,
    );
  }

  @Get()
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get incidents with optional filters' })
  @ApiResponse({ status: 200, description: 'Incidents retrieved successfully', type: [IncidentReport] })
  async getIncidents(
    @Query() filters: IncidentFilterDto,
    @CurrentUser() user: AuthUser,
  ): Promise<IncidentReport[]> {
    return this.incidentsService.getIncidents(
      filters,
      user.id,
      user.roles.map((r) => r.role),
    );
  }

  @Get(':id')
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get incident by ID' })
  @ApiResponse({ status: 200, description: 'Incident retrieved successfully', type: IncidentReport })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  async getIncidentById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<IncidentReport> {
    return this.incidentsService.getIncidentById(id, user.id, user.roles.map((r) => r.role));
  }

  @Put(':id')
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Update an incident report' })
  @ApiResponse({ status: 200, description: 'Incident updated successfully', type: IncidentReport })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async updateIncident(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<IncidentReport> {
    return this.incidentsService.updateIncident(id, dto, user.id, user.roles.map((r) => r.role));
  }

  @Post(':id/follow-up')
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Add a follow-up note to an incident' })
  @ApiResponse({ status: 200, description: 'Follow-up added successfully', type: IncidentReport })
  async addFollowUp(
    @Param('id') id: string,
    @Body() dto: AddFollowUpDto,
    @CurrentUser() user: AuthUser,
  ): Promise<IncidentReport> {
    return this.incidentsService.addFollowUp(id, dto, user.id, user.roles.map((r) => r.role));
  }
}


