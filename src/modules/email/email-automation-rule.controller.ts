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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EmailAutomationRuleService } from './email-automation-rule.service';
import { CreateEmailAutomationRuleDto } from './dto/create-email-automation-rule.dto';
import { UpdateEmailAutomationRuleDto } from './dto/update-email-automation-rule.dto';
import { EmailAutomationRuleResponseDto } from './dto/email-automation-rule-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { EmailAutomationRule } from './entities/email-automation-rule.entity';

@ApiTags('Email Automation Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email/automation-rules')
export class EmailAutomationRuleController {
  constructor(private readonly emailAutomationRuleService: EmailAutomationRuleService) {}

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get all email automation rules for a school' })
  @ApiQuery({ name: 'schoolId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of email automation rules',
    type: [EmailAutomationRuleResponseDto],
  })
  async findAll(
    @Query('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<EmailAutomationRuleResponseDto[]> {
    const rules = await this.emailAutomationRuleService.findAll(schoolId, user);
    return rules.map(rule => this.mapToResponseDto(rule));
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get email automation rule by ID' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Email automation rule found',
    type: EmailAutomationRuleResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<EmailAutomationRuleResponseDto> {
    const rule = await this.emailAutomationRuleService.findOne(id, user);
    return this.mapToResponseDto(rule);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new email automation rule' })
  @ApiResponse({
    status: 201,
    description: 'Email automation rule created successfully',
    type: EmailAutomationRuleResponseDto,
  })
  async create(
    @Body() createEmailAutomationRuleDto: CreateEmailAutomationRuleDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EmailAutomationRuleResponseDto> {
    const rule = await this.emailAutomationRuleService.create(
      createEmailAutomationRuleDto,
      user.id,
      user,
    );
    return this.mapToResponseDto(rule);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update an email automation rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Email automation rule updated successfully',
    type: EmailAutomationRuleResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmailAutomationRuleDto: UpdateEmailAutomationRuleDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EmailAutomationRuleResponseDto> {
    const rule = await this.emailAutomationRuleService.update(id, updateEmailAutomationRuleDto, user);
    return this.mapToResponseDto(rule);
  }

  @Patch(':id/status')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Toggle email automation rule active status' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Rule status updated successfully',
    type: EmailAutomationRuleResponseDto,
  })
  async toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isActive: boolean },
    @CurrentUser() user: AuthUser,
  ): Promise<EmailAutomationRuleResponseDto> {
    const rule = await this.emailAutomationRuleService.toggleStatus(id, body.isActive, user);
    return this.mapToResponseDto(rule);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete an email automation rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Rule deleted successfully',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    await this.emailAutomationRuleService.remove(id, user);
    return { message: 'Email automation rule deleted successfully' };
  }

  private mapToResponseDto(rule: EmailAutomationRule): EmailAutomationRuleResponseDto {
    return {
      id: rule.id,
      schoolId: rule.schoolId,
      ruleName: rule.ruleName,
      triggerEvent: rule.triggerEvent,
      triggerConditions: rule.triggerConditions,
      emailTemplateId: rule.emailTemplateId,
      isActive: rule.isActive,
      createdBy: rule.createdBy,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
      emailTemplate: rule.emailTemplate ? {
        id: rule.emailTemplate.id,
        name: rule.emailTemplate.name,
      } : null,
    };
  }
}















