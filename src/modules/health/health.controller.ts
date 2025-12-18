import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { HealthService } from './health.service';
import { MedicationService } from './medication.service';
import { CreateIllnessLogDto } from './dto/create-illness-log.dto';
import { CreateMedicationAuthorizationDto } from './dto/create-medication-authorization.dto';
import { ApproveMedicationDto } from './dto/approve-medication.dto';
import { LogMedicationDto } from './dto/log-medication.dto';
import { IllnessLog } from './entities/illness-log.entity';
import { MedicationAuthorization } from './entities/medication-authorization.entity';
import { MedicationLog } from './entities/medication-log.entity';

@ApiTags('Health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly medicationService: MedicationService,
  ) {}

  // Illness Logs Endpoints
  @Post('illness')
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Create an illness log' })
  @ApiResponse({ status: 201, description: 'Illness log created successfully', type: IllnessLog })
  async createIllnessLog(
    @Body() dto: CreateIllnessLogDto,
    @CurrentUser() user: AuthUser,
  ): Promise<IllnessLog> {
    const schoolId = user.roles.find((r) => r.schoolId)?.schoolId;
    if (!schoolId) {
      throw new Error('User must be associated with a school');
    }

    return this.healthService.createIllnessLog(
      dto,
      user.id,
      user.roles.map((r) => r.role),
      schoolId,
    );
  }

  @Get('illness')
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get illness logs' })
  @ApiResponse({ status: 200, description: 'Illness logs retrieved successfully', type: [IllnessLog] })
  async getIllnessLogs(
    @Query('studentId') studentId: string,
    @Query('schoolId') schoolId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<IllnessLog[]> {
    return this.healthService.getIllnessLogs(
      studentId,
      schoolId,
      user.id,
      user.roles.map((r) => r.role),
    );
  }

  @Get('illness/:id')
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get illness log by ID' })
  @ApiResponse({ status: 200, description: 'Illness log retrieved successfully', type: IllnessLog })
  async getIllnessLogById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<IllnessLog> {
    return this.healthService.getIllnessLogById(id, user.id, user.roles.map((r) => r.role));
  }

  // Medication Authorization Endpoints
  @Post('medication/authorization')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Create a medication authorization request' })
  @ApiResponse({ status: 201, description: 'Authorization created successfully', type: MedicationAuthorization })
  async createAuthorization(
    @Body() dto: CreateMedicationAuthorizationDto,
    @CurrentUser() user: AuthUser,
  ): Promise<MedicationAuthorization> {
    const schoolId = user.roles.find((r) => r.schoolId)?.schoolId;
    if (!schoolId) {
      throw new Error('User must be associated with a school');
    }

    return this.medicationService.createAuthorization(dto, user.id, schoolId);
  }

  @Get('medication/authorization')
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get medication authorizations' })
  @ApiResponse({ status: 200, description: 'Authorizations retrieved successfully', type: [MedicationAuthorization] })
  async getAuthorizations(
    @Query('studentId') studentId: string,
    @Query('schoolId') schoolId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<MedicationAuthorization[]> {
    return this.medicationService.getAuthorizations(
      studentId,
      schoolId,
      user.id,
      user.roles.map((r) => r.role),
    );
  }

  @Put('medication/authorization/:id/approve')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Approve or reject medication authorization' })
  @ApiResponse({ status: 200, description: 'Authorization updated successfully', type: MedicationAuthorization })
  async approveAuthorization(
    @Param('id') id: string,
    @Body() dto: ApproveMedicationDto,
    @CurrentUser() user: AuthUser,
  ): Promise<MedicationAuthorization> {
    return this.medicationService.approveAuthorization(
      id,
      dto,
      user.id,
      user.roles.map((r) => r.role),
    );
  }

  // Medication Log Endpoints
  @Post('medication/log')
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Log medication administration' })
  @ApiResponse({ status: 201, description: 'Medication logged successfully', type: MedicationLog })
  async logMedication(
    @Body() dto: LogMedicationDto,
    @CurrentUser() user: AuthUser,
  ): Promise<MedicationLog> {
    return this.medicationService.logMedication(dto, user.id, user.roles.map((r) => r.role));
  }

  @Get('medication/log')
  @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get medication logs' })
  @ApiResponse({ status: 200, description: 'Medication logs retrieved successfully', type: [MedicationLog] })
  async getMedicationLogs(
    @Query('studentId') studentId: string,
    @Query('authorizationId') authorizationId: string,
    @Query('schoolId') schoolId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<MedicationLog[]> {
    return this.medicationService.getMedicationLogs(
      studentId,
      authorizationId,
      schoolId,
      user.id,
      user.roles.map((r) => r.role),
    );
  }
}


