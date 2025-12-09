import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AnalyticsService, SchoolMetricsResponse, ConversionFunnelData, CampaignConversionData } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('school-metrics')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get comprehensive school metrics for analytics',
    description:
      'Get aggregated metrics for all schools or specific schools. Returns per-school metrics and aggregate totals. This endpoint eliminates N+1 queries by batching all data fetches.',
  })
  @ApiQuery({
    name: 'schoolIds',
    required: false,
    type: String,
    description: 'Comma-separated list of school IDs to filter by. If not provided, returns all active schools.',
    example: 'uuid1,uuid2,uuid3',
  })
  @ApiQuery({
    name: 'includeGrowth',
    required: false,
    type: Boolean,
    description: 'Whether to include monthly growth calculations (default: true)',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'School metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              schoolId: { type: 'string' },
              schoolName: { type: 'string' },
              totalStudents: { type: 'number' },
              totalRevenue: { type: 'number' },
              enrollmentRate: { type: 'number' },
              activePrograms: { type: 'number' },
              leadConversionRate: { type: 'number' },
              monthlyGrowth: {
                type: 'object',
                properties: {
                  students: { type: 'number' },
                  revenue: { type: 'number' },
                  enrollment: { type: 'number' },
                },
              },
            },
          },
        },
        aggregate: {
          type: 'object',
          properties: {
            totalSchools: { type: 'number' },
            totalStudents: { type: 'number' },
            totalRevenue: { type: 'number' },
            avgEnrollmentRate: { type: 'number' },
            avgConversionRate: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getSchoolMetrics(
    @Query('schoolIds') schoolIds?: string,
    @Query('includeGrowth') includeGrowth?: string,
  ): Promise<SchoolMetricsResponse> {
    const schoolIdArray = schoolIds
      ? schoolIds.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined;

    const includeGrowthBool =
      includeGrowth === undefined ? true : includeGrowth === 'true';

    return this.analyticsService.getSchoolMetrics(
      schoolIdArray,
      includeGrowthBool,
    );
  }

  @Post('retention-risks')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Analyze retention risks for a school',
    description: 'AI-powered analysis to identify families at risk of withdrawal based on payment patterns, engagement levels, and enrollment duration.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        schoolId: {
          type: 'string',
          format: 'uuid',
          description: 'School ID to analyze',
        },
      },
      required: ['schoolId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Retention risk analysis completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            overallHealth: {
              type: 'object',
              properties: {
                retentionScore: { type: 'number' },
                totalFamilies: { type: 'number' },
                atRiskCount: { type: 'number' },
                healthStatus: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
                trendDirection: { type: 'string', enum: ['improving', 'stable', 'declining'] },
              },
            },
            atRiskFamilies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  enrollmentId: { type: 'string' },
                  childName: { type: 'string' },
                  parentName: { type: 'string' },
                  parentEmail: { type: 'string' },
                  parentPhone: { type: 'string' },
                  riskScore: { type: 'number' },
                  riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  primaryRiskFactors: { type: 'array', items: { type: 'string' } },
                  paymentIssues: { type: 'string' },
                  engagementIssues: { type: 'string' },
                  recommendedActions: { type: 'array', items: { type: 'string' } },
                  urgency: { type: 'string', enum: ['immediate', 'this_week', 'this_month'] },
                  estimatedWithdrawalWindow: { type: 'string' },
                },
              },
            },
            riskPatterns: {
              type: 'object',
              properties: {
                paymentRelated: { type: 'number' },
                engagementRelated: { type: 'number' },
                newFamilyRisk: { type: 'number' },
                communicationGaps: { type: 'number' },
              },
            },
            strategicRecommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  recommendation: { type: 'string' },
                  expectedImpact: { type: 'string', enum: ['high', 'medium', 'low'] },
                },
              },
            },
            analysis: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                familiesAnalyzed: { type: 'number' },
                dataQuality: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async analyzeRetentionRisks(@Body() body: { schoolId: string }) {
    return this.analyticsService.analyzeRetentionRisks(body.schoolId);
  }

  @Get('conversion-funnel')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Get conversion funnel data for a school',
    description: 'Returns conversion funnel metrics including leads, waitlist, and enrollment stages with conversion rates.',
  })
  @ApiQuery({ name: 'schoolId', required: true, type: String, description: 'School ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter (ISO string)' })
  @ApiQuery({ name: 'leadSource', required: false, type: String, description: 'Filter by lead source' })
  @ApiQuery({ name: 'program', required: false, type: String, description: 'Filter by program' })
  @ApiQuery({ name: 'leadStatus', required: false, type: String, description: 'Filter by lead status' })
  @ApiQuery({ name: 'minScore', required: false, type: Number, description: 'Minimum lead score' })
  @ApiQuery({ name: 'maxScore', required: false, type: Number, description: 'Maximum lead score' })
  @ApiQuery({ name: 'priority', required: false, type: String, description: 'Filter by priority' })
  @ApiQuery({ name: 'admissionStaff', required: false, type: String, description: 'Filter by admission staff ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversion funnel data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stage: { type: 'string' },
          count: { type: 'number' },
          conversion_rate: { type: 'number' },
          drop_off_rate: { type: 'number' },
          avg_time_to_next_stage: { type: 'number' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getConversionFunnel(
    @Query('schoolId') schoolId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('leadSource') leadSource?: string,
    @Query('program') program?: string,
    @Query('leadStatus') leadStatus?: string,
    @Query('minScore') minScore?: number,
    @Query('maxScore') maxScore?: number,
    @Query('priority') priority?: string,
    @Query('admissionStaff') admissionStaff?: string,
  ): Promise<ConversionFunnelData[]> {
    return this.analyticsService.getConversionFunnelData(schoolId, {
      startDate,
      endDate,
      leadSource,
      program,
      leadStatus,
      minScore: minScore ? Number(minScore) : undefined,
      maxScore: maxScore ? Number(maxScore) : undefined,
      priority,
      admissionStaff,
    });
  }

  @Get('campaign-conversion')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Get campaign conversion data for a school',
    description: 'Returns campaign performance metrics including conversion rates from campaigns to leads, waitlist, and enrollment.',
  })
  @ApiQuery({ name: 'schoolId', required: true, type: String, description: 'School ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign conversion data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string' },
          campaign_name: { type: 'string' },
          total_sent: { type: 'number' },
          leads_generated: { type: 'number' },
          waitlist_conversions: { type: 'number' },
          enrollment_conversions: { type: 'number' },
          lead_conversion_rate: { type: 'number' },
          waitlist_conversion_rate: { type: 'number' },
          enrollment_conversion_rate: { type: 'number' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getCampaignConversion(
    @Query('schoolId') schoolId: string,
  ): Promise<CampaignConversionData[]> {
    return this.analyticsService.getCampaignConversionData(schoolId);
  }
}



