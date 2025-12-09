import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AppRole } from '../../common/enums/app-role.enum';
import { SchoolEntity } from '../schools/entities/school.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
  ) {}

  /**
   * Create a new report
   */
  async create(createReportDto: CreateReportDto, createdBy: string): Promise<Report> {
    this.logger.log(`Creating report: ${createReportDto.reportName}`);

    const report = this.reportRepository.create({
      ...createReportDto,
      createdBy,
      dateRangeStart: createReportDto.dateRangeStart ? new Date(createReportDto.dateRangeStart) : null,
      dateRangeEnd: createReportDto.dateRangeEnd ? new Date(createReportDto.dateRangeEnd) : null,
      metadata: createReportDto.metadata || {},
    });

    return this.reportRepository.save(report);
  }

  /**
   * Find all reports with access control
   */
  async findAll(user: AuthUser, options?: {
    schoolId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ reports: Report[]; total: number }> {
    const query = this.reportRepository.createQueryBuilder('report');

    // Access control
    if (user.primaryRole !== AppRole.SUPER_ADMIN) {
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

      if (accessibleSchoolIds.size > 0) {
        query.andWhere('(report.school_id IN (:...schoolIds) OR report.school_id IS NULL)', {
          schoolIds: Array.from(accessibleSchoolIds),
        });
      } else {
        // User has no school access, only show reports they created
        query.andWhere('report.created_by = :userId', { userId: user.id });
      }
    }

    // Filter by school if specified
    if (options?.schoolId) {
      query.andWhere('report.school_id = :schoolId', { schoolId: options.schoolId });
    }

    const total = await query.getCount();

    if (options?.limit) {
      query.limit(options.limit);
    }
    if (options?.offset) {
      query.offset(options.offset);
    }

    query.orderBy('report.createdAt', 'DESC');

    const reports = await query.getMany();

    return { reports, total };
  }

  /**
   * Find one report by ID
   */
  async findOne(id: string, user: AuthUser): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['school'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID "${id}" not found`);
    }

    // Access control
    await this.ensureUserCanAccessReport(user, report);

    return report;
  }

  /**
   * Update a report
   */
  async update(id: string, updateReportDto: UpdateReportDto, user: AuthUser): Promise<Report> {
    const report = await this.findOne(id, user);
    
    // Only allow updating reports created by the user or super admin
    if (user.primaryRole !== AppRole.SUPER_ADMIN && report.createdBy !== user.id) {
      throw new ForbiddenException('You can only update reports you created');
    }

    const updateData: any = { ...updateReportDto };

    if (updateReportDto.dateRangeStart) {
      updateData.dateRangeStart = new Date(updateReportDto.dateRangeStart);
    }
    if (updateReportDto.dateRangeEnd) {
      updateData.dateRangeEnd = new Date(updateReportDto.dateRangeEnd);
    }

    Object.assign(report, updateData);

    return this.reportRepository.save(report);
  }

  /**
   * Delete a report
   */
  async remove(id: string, user: AuthUser): Promise<void> {
    const report = await this.findOne(id, user);
    
    // Only allow deleting reports created by the user or super admin
    if (user.primaryRole !== AppRole.SUPER_ADMIN && report.createdBy !== user.id) {
      throw new ForbiddenException('You can only delete reports you created');
    }
    
    await this.reportRepository.remove(report);
  }

  /**
   * Ensure user can access a report
   */
  private async ensureUserCanAccessReport(user: AuthUser, report: Report): Promise<void> {
    if (user.primaryRole === AppRole.SUPER_ADMIN) {
      return;
    }

    // User can access reports they created
    if (report.createdBy === user.id) {
      return;
    }

    // Check school access
    if (report.schoolId) {
      // Check if user's primary school matches
      if (user.schoolId === report.schoolId) {
        return;
      }
      
      // Check if user has role for this school
      const hasRoleForSchool = user.roles?.some(role => role.schoolId === report.schoolId);
      if (hasRoleForSchool) {
        return;
      }

      // For SCHOOL_OWNER, check if they own the school
      if (user.primaryRole === AppRole.SCHOOL_OWNER) {
        const school = await this.schoolRepository.findOne({
          where: { id: report.schoolId },
          select: ['ownerId'],
        });
        if (school && school.ownerId === user.id) {
          return;
        }
      }
    } else {
      // Report is for all schools - check if user has any school access
      const accessibleSchoolIds = new Set<string>();
      
      if (user.schoolId) {
        accessibleSchoolIds.add(user.schoolId);
      }
      
      user.roles?.forEach((role) => {
        if (role.schoolId) {
          accessibleSchoolIds.add(role.schoolId);
        }
      });

      // For SCHOOL_OWNER, get all owned schools
      if (user.primaryRole === AppRole.SCHOOL_OWNER) {
        const ownedSchools = await this.schoolRepository.find({
          where: { ownerId: user.id },
          select: ['id'],
        });
        ownedSchools.forEach(school => accessibleSchoolIds.add(school.id));
      }

      if (accessibleSchoolIds.size > 0) {
        return; // User has school access, can view all-school reports
      }
    }

    throw new ForbiddenException('You do not have access to this report');
  }
}

