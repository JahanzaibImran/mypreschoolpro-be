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
import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplateResponseDto } from './dto/email-template-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { EmailTemplate } from './entities/email-template.entity';

@ApiTags('Email Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email/templates')
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get all email templates for a school' })
  @ApiQuery({ name: 'schoolId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of email templates',
    type: [EmailTemplateResponseDto],
  })
  async findAll(
    @Query('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<EmailTemplateResponseDto[]> {
    const templates = await this.emailTemplateService.findAll(schoolId, user);
    return templates.map(template => this.mapToResponseDto(template));
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get email template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Email template found',
    type: EmailTemplateResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<EmailTemplateResponseDto> {
    const template = await this.emailTemplateService.findOne(id, user);
    return this.mapToResponseDto(template);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new email template' })
  @ApiResponse({
    status: 201,
    description: 'Email template created successfully',
    type: EmailTemplateResponseDto,
  })
  async create(
    @Body() createEmailTemplateDto: CreateEmailTemplateDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EmailTemplateResponseDto> {
    const template = await this.emailTemplateService.create(
      createEmailTemplateDto,
      user.id,
      user,
    );
    return this.mapToResponseDto(template);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update an email template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Email template updated successfully',
    type: EmailTemplateResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmailTemplateDto: UpdateEmailTemplateDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EmailTemplateResponseDto> {
    const template = await this.emailTemplateService.update(id, updateEmailTemplateDto, user);
    return this.mapToResponseDto(template);
  }

  @Patch(':id/status')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Toggle email template active status' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template status updated successfully',
    type: EmailTemplateResponseDto,
  })
  async toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isActive: boolean },
    @CurrentUser() user: AuthUser,
  ): Promise<EmailTemplateResponseDto> {
    const template = await this.emailTemplateService.toggleStatus(id, body.isActive, user);
    return this.mapToResponseDto(template);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete an email template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template deleted successfully',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    await this.emailTemplateService.remove(id, user);
    return { message: 'Email template deleted successfully' };
  }

  private mapToResponseDto(template: EmailTemplate): EmailTemplateResponseDto {
    return {
      id: template.id,
      schoolId: template.schoolId,
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      category: template.category,
      isActive: template.isActive,
      templateVariables: template.templateVariables || [],
      createdBy: template.createdBy,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}











