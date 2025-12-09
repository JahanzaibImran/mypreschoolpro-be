import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity } from '../users/entities/profile.entity';
import { SchoolEntity, SchoolStatus } from '../schools/entities/school.entity';
import { Subscription, SubscriptionStatus } from '../payments/entities/subscription.entity';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  @Get('stats')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.TEACHER)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Returns aggregated statistics for the dashboard metrics.',
  })
  async getStats(
    @CurrentUser() user: AuthUser,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(user, query);
  }

  @Get('super-admin-stats')
  @Roles(AppRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get super admin statistics',
    description: 'Returns system-wide statistics for super admin dashboard (users, schools, subscriptions).',
  })
  @ApiResponse({
    status: 200,
    description: 'Super admin statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 150 },
        totalSchools: { type: 'number', example: 25 },
        activeSubscriptions: { type: 'number', example: 20 },
        totalRevenue: { type: 'number', example: 50000 },
      },
    },
  })
  async getSuperAdminStats(): Promise<{
    totalUsers: number;
    totalSchools: number;
    activeSubscriptions: number;
    totalRevenue: number;
  }> {
    const [totalUsers, totalSchools, activeSubscriptions] = await Promise.all([
      this.profileRepository.count(),
      this.schoolRepository.count({ where: { status: SchoolStatus.ACTIVE } }),
      this.subscriptionRepository.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    ]);

    // Calculate total revenue from transactions (would need Transaction repository)
    // For now, return 0 as placeholder
    const totalRevenue = 0;

    return {
      totalUsers,
      totalSchools,
      activeSubscriptions,
      totalRevenue,
    };
  }
}











