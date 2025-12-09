import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationTemplateService } from './notification-template.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { NotificationTemplateResponseDto } from './dto/notification-template-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { NotificationTemplate } from './entities/notification-template.entity';

@ApiTags('Notification Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-templates')
export class NotificationTemplateController {
  constructor(private readonly notificationTemplateService: NotificationTemplateService) {}

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.TEACHER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({
    status: 200,
    description: 'List of notification templates',
    type: [NotificationTemplateResponseDto],
  })
  async findAll(): Promise<NotificationTemplateResponseDto[]> {
    const templates = await this.notificationTemplateService.findAll();
    return templates.map(template => this.mapToResponseDto(template));
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.TEACHER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get notification template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification template found',
    type: NotificationTemplateResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationTemplateResponseDto> {
    const template = await this.notificationTemplateService.findOne(id);
    return this.mapToResponseDto(template);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new notification template (super admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Notification template created successfully',
    type: NotificationTemplateResponseDto,
  })
  async create(
    @Body() createNotificationTemplateDto: CreateNotificationTemplateDto,
    @CurrentUser() user: AuthUser,
  ): Promise<NotificationTemplateResponseDto> {
    const template = await this.notificationTemplateService.create(
      createNotificationTemplateDto,
    );
    return this.mapToResponseDto(template);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Update a notification template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification template updated successfully',
    type: NotificationTemplateResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotificationTemplateDto: UpdateNotificationTemplateDto,
    @CurrentUser() user: AuthUser,
  ): Promise<NotificationTemplateResponseDto> {
    const template = await this.notificationTemplateService.update(
      id,
      updateNotificationTemplateDto,
      user,
    );
    return this.mapToResponseDto(template);
  }

  @Delete(':id')
  @Roles(AppRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a notification template (super admin only)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template deleted successfully',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    await this.notificationTemplateService.remove(id, user);
    return { message: 'Notification template deleted successfully' };
  }

  @Post(':id/attachment')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        const allowedDocs = [
          'application/pdf',
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-excel', // .xls
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'text/plain', // .txt
        ];
        if (allowedDocs.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT are allowed.'),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload attachment for notification template' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Attachment file (PDF, DOC, DOCX, XLS, XLSX, TXT, max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Attachment uploaded successfully',
    type: NotificationTemplateResponseDto,
  })
  async uploadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ): Promise<NotificationTemplateResponseDto> {
    const template = await this.notificationTemplateService.uploadAttachment(
      id,
      file,
      user,
    );
    return this.mapToResponseDto(template);
  }

  @Delete(':id/attachment')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Remove attachment from notification template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Attachment removed successfully',
    type: NotificationTemplateResponseDto,
  })
  async removeAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<NotificationTemplateResponseDto> {
    const template = await this.notificationTemplateService.removeAttachment(
      id,
      user,
    );
    return this.mapToResponseDto(template);
  }

  private mapToResponseDto(template: NotificationTemplate): NotificationTemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type,
      variables: template.variables || {},
      active: template.active,
      attachmentUrl: template.attachmentUrl,
      attachmentName: template.attachmentName,
      createdBy: null, // Column doesn't exist in database
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}

