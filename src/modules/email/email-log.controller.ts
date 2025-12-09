import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog } from './entities/email-log.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { SchoolEntity } from '../schools/entities/school.entity';

@ApiTags('Email Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email/logs')
export class EmailLogController {
  constructor(
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
  ) {}

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get email logs for a school' })
  @ApiQuery({ name: 'schoolId', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results (default: 100)' })
  @ApiResponse({
    status: 200,
    description: 'List of email logs',
  })
  async findAll(
    @Query('schoolId', ParseUUIDPipe) schoolId: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: AuthUser,
  ) {
    // Ensure user has access to school
    if (user && user.primaryRole !== AppRole.SUPER_ADMIN) {
      const accessibleSchoolIds = new Set<string>();
      if (user.schoolId) {
        accessibleSchoolIds.add(user.schoolId);
      }
      user.roles?.forEach((role) => {
        if (role.schoolId) {
          accessibleSchoolIds.add(role.schoolId);
        }
      });
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

    const query = this.emailLogRepository
      .createQueryBuilder('log')
      .where('log.schoolId = :schoolId', { schoolId })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit || 100);

    const logs = await query.getMany();

    return logs.map(log => ({
      id: log.id,
      schoolId: log.schoolId,
      recipientEmail: log.recipientEmail,
      subject: log.subject,
      status: log.status,
      sentAt: log.sentAt ? log.sentAt.toISOString() : null,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt.toISOString(),
    }));
  }
}

