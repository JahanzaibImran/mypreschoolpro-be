import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAutomationRule } from './entities/email-automation-rule.entity';
import { CreateEmailAutomationRuleDto } from './dto/create-email-automation-rule.dto';
import { UpdateEmailAutomationRuleDto } from './dto/update-email-automation-rule.dto';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AppRole } from '../../common/enums/app-role.enum';
import { SchoolEntity } from '../schools/entities/school.entity';

@Injectable()
export class EmailAutomationRuleService {
  private readonly logger = new Logger(EmailAutomationRuleService.name);

  constructor(
    @InjectRepository(EmailAutomationRule)
    private readonly emailAutomationRuleRepository: Repository<EmailAutomationRule>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
  ) {}

  /**
   * Find all automation rules for a school
   */
  async findAll(schoolId: string, user: AuthUser): Promise<EmailAutomationRule[]> {
    await this.ensureUserHasAccessToSchool(user, schoolId);

    return this.emailAutomationRuleRepository.find({
      where: { schoolId },
      relations: ['emailTemplate'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find one rule by ID
   */
  async findOne(id: string, user: AuthUser): Promise<EmailAutomationRule> {
    const rule = await this.emailAutomationRuleRepository.findOne({
      where: { id },
      relations: ['school', 'emailTemplate'],
    });

    if (!rule) {
      throw new NotFoundException(`Email automation rule with ID "${id}" not found`);
    }

    await this.ensureUserHasAccessToSchool(user, rule.schoolId);

    return rule;
  }

  /**
   * Create a new rule
   */
  async create(
    createEmailAutomationRuleDto: CreateEmailAutomationRuleDto,
    createdBy: string,
    user: AuthUser,
  ): Promise<EmailAutomationRule> {
    await this.ensureUserHasAccessToSchool(user, createEmailAutomationRuleDto.schoolId);

    const rule = this.emailAutomationRuleRepository.create({
      ...createEmailAutomationRuleDto,
      createdBy,
      isActive: createEmailAutomationRuleDto.isActive ?? true,
    });

    return this.emailAutomationRuleRepository.save(rule);
  }

  /**
   * Update a rule
   */
  async update(
    id: string,
    updateEmailAutomationRuleDto: UpdateEmailAutomationRuleDto,
    user: AuthUser,
  ): Promise<EmailAutomationRule> {
    const rule = await this.findOne(id, user);

    Object.assign(rule, updateEmailAutomationRuleDto);

    return this.emailAutomationRuleRepository.save(rule);
  }

  /**
   * Toggle rule active status
   */
  async toggleStatus(id: string, isActive: boolean, user: AuthUser): Promise<EmailAutomationRule> {
    const rule = await this.findOne(id, user);

    rule.isActive = isActive;

    return this.emailAutomationRuleRepository.save(rule);
  }

  /**
   * Delete a rule
   */
  async remove(id: string, user: AuthUser): Promise<void> {
    const rule = await this.findOne(id, user);
    await this.emailAutomationRuleRepository.remove(rule);
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








