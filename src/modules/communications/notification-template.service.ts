import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AppRole } from '../../common/enums/app-role.enum';
import { S3Service } from '../media/s3.service';

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly notificationTemplateRepository: Repository<NotificationTemplate>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Find all notification templates
   */
  async findAll(): Promise<NotificationTemplate[]> {
    return this.notificationTemplateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find one template by ID
   */
  async findOne(id: string): Promise<NotificationTemplate> {
    const template = await this.notificationTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Notification template with ID "${id}" not found`);
    }

    return template;
  }

  /**
   * Create a new template (super admin only)
   */
  async create(
    createNotificationTemplateDto: CreateNotificationTemplateDto,
  ): Promise<NotificationTemplate> {
    const template = this.notificationTemplateRepository.create({
      ...createNotificationTemplateDto,
      active: createNotificationTemplateDto.active ?? true,
      variables: createNotificationTemplateDto.variables || {},
    });

    return this.notificationTemplateRepository.save(template);
  }

  /**
   * Update a template (super admin or school owner)
   */
  async update(
    id: string,
    updateNotificationTemplateDto: UpdateNotificationTemplateDto,
    user: AuthUser,
  ): Promise<NotificationTemplate> {
    const template = await this.findOne(id);

    // Check permissions: super admin can update any, school owner can update any
    if (user.primaryRole !== AppRole.SUPER_ADMIN && user.primaryRole !== AppRole.SCHOOL_OWNER) {
      throw new ForbiddenException('Only super admins and school owners can update templates');
    }

    Object.assign(template, updateNotificationTemplateDto);

    return this.notificationTemplateRepository.save(template);
  }

  /**
   * Delete a template (super admin only)
   */
  async remove(id: string, user: AuthUser): Promise<void> {
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can delete templates');
    }

    const template = await this.findOne(id);
    
    // Remove attachment from S3 if exists
    if (template.attachmentUrl) {
      try {
        await this.s3Service.deleteFile(template.attachmentUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete attachment from S3: ${error.message}`);
      }
    }
    
    await this.notificationTemplateRepository.remove(template);
  }

  /**
   * Upload attachment for a template
   */
  async uploadAttachment(
    id: string,
    file: Express.Multer.File,
    user: AuthUser,
  ): Promise<NotificationTemplate> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const template = await this.findOne(id);

    // Check permissions
    if (user.primaryRole !== AppRole.SUPER_ADMIN && user.primaryRole !== AppRole.SCHOOL_OWNER) {
      throw new ForbiddenException('Only super admins and school owners can upload attachments');
    }

    // Remove old attachment if exists
    if (template.attachmentUrl) {
      try {
        await this.s3Service.deleteFile(template.attachmentUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete old attachment from S3: ${error.message}`);
      }
    }

    // Upload new file to S3
    const folder = 'notification-attachments';
    const { fileUrl } = await this.s3Service.uploadFile(file, folder);

    // Update template
    template.attachmentUrl = fileUrl;
    template.attachmentName = file.originalname;

    return this.notificationTemplateRepository.save(template);
  }

  /**
   * Remove attachment from a template
   */
  async removeAttachment(
    id: string,
    user: AuthUser,
  ): Promise<NotificationTemplate> {
    const template = await this.findOne(id);

    // Check permissions
    if (user.primaryRole !== AppRole.SUPER_ADMIN && user.primaryRole !== AppRole.SCHOOL_OWNER) {
      throw new ForbiddenException('Only super admins and school owners can remove attachments');
    }

    if (!template.attachmentUrl) {
      throw new BadRequestException('Template has no attachment to remove');
    }

    // Delete from S3
    try {
      await this.s3Service.deleteFile(template.attachmentUrl);
    } catch (error) {
      this.logger.warn(`Failed to delete attachment from S3: ${error.message}`);
    }

    // Update template
    template.attachmentUrl = null;
    template.attachmentName = null;

    return this.notificationTemplateRepository.save(template);
  }
}

