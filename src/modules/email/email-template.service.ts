import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AppRole } from '../../common/enums/app-role.enum';
import { SchoolEntity } from '../schools/entities/school.entity';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);

  constructor(
    @InjectRepository(EmailTemplate)
    private readonly emailTemplateRepository: Repository<EmailTemplate>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
  ) {}

  /**
   * Find all templates for a school
   */
  async findAll(schoolId: string, user: AuthUser): Promise<EmailTemplate[]> {
    await this.ensureUserHasAccessToSchool(user, schoolId);

    return this.emailTemplateRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find one template by ID
   */
  async findOne(id: string, user: AuthUser): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id },
      relations: ['school'],
    });

    if (!template) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }

    await this.ensureUserHasAccessToSchool(user, template.schoolId);

    return template;
  }

  /**
   * Create a new template
   */
  async create(
    createEmailTemplateDto: CreateEmailTemplateDto,
    createdBy: string,
    user: AuthUser,
  ): Promise<EmailTemplate> {
    await this.ensureUserHasAccessToSchool(user, createEmailTemplateDto.schoolId);

    const template = this.emailTemplateRepository.create({
      ...createEmailTemplateDto,
      createdBy,
      isActive: true,
      templateVariables: createEmailTemplateDto.templateVariables || [],
    });

    return this.emailTemplateRepository.save(template);
  }

  /**
   * Update a template
   */
  async update(
    id: string,
    updateEmailTemplateDto: UpdateEmailTemplateDto,
    user: AuthUser,
  ): Promise<EmailTemplate> {
    const template = await this.findOne(id, user);

    Object.assign(template, updateEmailTemplateDto);

    return this.emailTemplateRepository.save(template);
  }

  /**
   * Toggle template active status
   */
  async toggleStatus(id: string, isActive: boolean, user: AuthUser): Promise<EmailTemplate> {
    const template = await this.findOne(id, user);

    template.isActive = isActive;

    return this.emailTemplateRepository.save(template);
  }

  /**
   * Delete a template
   */
  async remove(id: string, user: AuthUser): Promise<void> {
    const template = await this.findOne(id, user);
    await this.emailTemplateRepository.remove(template);
  }

  /**
   * Ensure user has access to the school
   */
  private async ensureUserHasAccessToSchool(user: AuthUser, schoolId: string): Promise<void> {
    if (user.primaryRole === AppRole.SUPER_ADMIN) {
      return;
    }

    const accessibleSchoolIds = new Set<string>();
    if (user.schoolId) {
      accessibleSchoolIds.add(user.schoolId);
    }

    user.roles?.forEach((role) => {
      if (role.schoolId) {
        accessibleSchoolIds.add(role.schoolId);
      }
    });

    // For SCHOOL_OWNER, also get schools they own
    if (user.primaryRole === AppRole.SCHOOL_OWNER) {
      const ownedSchools = await this.schoolRepository.find({
        where: { ownerId: user.id },
        select: ['id'],
      });
      ownedSchools.forEach(school => accessibleSchoolIds.add(school.id));
    }

    if (!accessibleSchoolIds.has(schoolId)) {
      throw new ForbiddenException('You do not have access to this school');
    }
  }
}








