import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, LessThan, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SchoolEntity } from '../schools/entities/school.entity';
import { EnrollmentEntity, EnrollmentStatus } from '../enrollment/entities/enrollment.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { LeadEntity, LeadStatus } from '../leads/entities/lead.entity';
import { Waitlist } from '../enrollment/entities/waitlist.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { CampaignRecipient } from '../campaigns/entities/campaign-recipient.entity';
import { CampaignStatus } from '../../common/enums/campaign-status.enum';

export interface SchoolMetrics {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  totalRevenue: number; // in dollars
  enrollmentRate: number;
  activePrograms: number;
  leadConversionRate: number;
  monthlyGrowth: {
    students: number;
    revenue: number;
    enrollment: number;
  };
}

export interface AggregateMetrics {
  totalSchools: number;
  totalStudents: number;
  totalRevenue: number;
  avgEnrollmentRate: number;
  avgConversionRate: number;
}

export interface SchoolMetricsResponse {
  data: SchoolMetrics[];
  aggregate: AggregateMetrics;
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  conversion_rate: number;
  drop_off_rate: number;
  avg_time_to_next_stage: number;
}

export interface CampaignConversionData {
  campaign_id: string;
  campaign_name: string;
  total_sent: number;
  leads_generated: number;
  waitlist_conversions: number;
  enrollment_conversions: number;
  lead_conversion_rate: number;
  waitlist_conversion_rate: number;
  enrollment_conversion_rate: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(Waitlist)
    private readonly waitlistRepository: Repository<Waitlist>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignRecipient)
    private readonly campaignRecipientRepository: Repository<CampaignRecipient>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get comprehensive school metrics for analytics
   */
  async getSchoolMetrics(
    schoolIds?: string[],
    includeGrowth: boolean = true,
  ): Promise<SchoolMetricsResponse> {
    this.logger.log(`Fetching school metrics for ${schoolIds?.length || 'all'} schools`);

    // Fetch schools
    const queryBuilder = this.schoolRepository
      .createQueryBuilder('school')
      .where('school.status = :status', { status: 'active' });

    if (schoolIds && schoolIds.length > 0) {
      queryBuilder.andWhere('school.id IN (:...schoolIds)', { schoolIds });
    }

    const schools = await queryBuilder.select(['school.id', 'school.name', 'school.capacity']).getMany();

    if (schools.length === 0) {
      return {
        data: [],
        aggregate: {
          totalSchools: 0,
          totalStudents: 0,
          totalRevenue: 0,
          avgEnrollmentRate: 0,
          avgConversionRate: 0,
        },
      };
    }

    const schoolIdArray = schools.map((s) => s.id);

    // Calculate date ranges for growth
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Batch fetch all data
    const [
      enrollmentCounts,
      enrollmentPrograms,
      recentEnrollments,
      previousEnrollments,
      transactions,
      leads,
    ] = await Promise.all([
      // Enrollment counts (active)
      this.getEnrollmentCountsBySchools(schoolIdArray, EnrollmentStatus.ACTIVE),

      // Unique programs per school
      this.getUniqueProgramsBySchools(schoolIdArray),

      // Recent enrollments (last 30 days)
      includeGrowth
        ? this.getEnrollmentCountsBySchoolsAndDateRange(
            schoolIdArray,
            thirtyDaysAgo,
            now,
          )
        : Promise.resolve({}),

      // Previous enrollments (30-60 days ago)
      includeGrowth
        ? this.getEnrollmentCountsBySchoolsAndDateRange(
            schoolIdArray,
            sixtyDaysAgo,
            thirtyDaysAgo,
          )
        : Promise.resolve({}),

      // Transactions (completed)
      this.getTransactionSumsBySchools(schoolIdArray),

      // Leads with conversion data
      this.getLeadConversionBySchools(schoolIdArray),
    ]);

    // Build metrics for each school
    const metrics: SchoolMetrics[] = schools.map((school) => {
      const studentsCount = enrollmentCounts[school.id] || 0;
      const uniquePrograms = enrollmentPrograms[school.id] || 0;
      const revenueCents = transactions[school.id] || 0;
      const revenue = revenueCents / 100; // Convert to dollars

      // Calculate enrollment rate (students vs capacity)
      const capacity = school.capacity || studentsCount * 1.2; // Fallback if capacity is 0
      const enrollmentRate =
        capacity > 0 ? Math.min((studentsCount / capacity) * 100, 100) : 0;

      // Lead conversion
      const leadData = leads[school.id] || { total: 0, converted: 0 };
      const leadConversionRate =
        leadData.total > 0 ? (leadData.converted / leadData.total) * 100 : 0;

      // Growth calculation
      const recentCount = recentEnrollments[school.id] || 0;
      const previousCount = previousEnrollments[school.id] || 0;
      const studentGrowth =
        previousCount > 0
          ? ((recentCount - previousCount) / previousCount) * 100
          : recentCount > 0
            ? 100
            : 0;

      return {
        schoolId: school.id,
        schoolName: school.name,
        totalStudents: studentsCount,
        totalRevenue: Number(revenue.toFixed(2)),
        enrollmentRate: Number(enrollmentRate.toFixed(1)),
        activePrograms: uniquePrograms,
        leadConversionRate: Number(leadConversionRate.toFixed(1)),
        monthlyGrowth: {
          students: Number(studentGrowth.toFixed(1)),
          revenue: 5.2, // TODO: Calculate actual revenue growth
          enrollment: 3.8, // TODO: Calculate actual enrollment growth
        },
      };
    });

    // Calculate aggregate metrics
    const totalStudents = metrics.reduce((sum, m) => sum + m.totalStudents, 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + m.totalRevenue, 0);
    const avgEnrollmentRate =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.enrollmentRate, 0) / metrics.length
        : 0;
    const avgConversionRate =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.leadConversionRate, 0) / metrics.length
        : 0;

    return {
      data: metrics,
      aggregate: {
        totalSchools: metrics.length,
        totalStudents,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        avgEnrollmentRate: Number(avgEnrollmentRate.toFixed(1)),
        avgConversionRate: Number(avgConversionRate.toFixed(1)),
      },
    };
  }

  /**
   * Get enrollment counts by school IDs
   */
  private async getEnrollmentCountsBySchools(
    schoolIds: string[],
    status?: EnrollmentStatus,
  ): Promise<Record<string, number>> {
    const queryBuilder = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.schoolId', 'schoolId')
      .addSelect('COUNT(enrollment.id)', 'count')
      .where('enrollment.schoolId IN (:...schoolIds)', { schoolIds })
      .groupBy('enrollment.schoolId');

    if (status) {
      queryBuilder.andWhere('enrollment.status = :status', { status });
    }

    const results = await queryBuilder.getRawMany();

    const counts: Record<string, number> = {};
    schoolIds.forEach((id) => {
      counts[id] = 0;
    });

    results.forEach((row: any) => {
      counts[row.schoolId] = parseInt(row.count, 10);
    });

    return counts;
  }

  /**
   * Get enrollment counts by school IDs and date range
   */
  private async getEnrollmentCountsBySchoolsAndDateRange(
    schoolIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const queryBuilder = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.schoolId', 'schoolId')
      .addSelect('COUNT(enrollment.id)', 'count')
      .where('enrollment.schoolId IN (:...schoolIds)', { schoolIds })
      .andWhere('enrollment.createdAt >= :startDate', { startDate })
      .andWhere('enrollment.createdAt < :endDate', { endDate })
      .groupBy('enrollment.schoolId');

    const results = await queryBuilder.getRawMany();

    const counts: Record<string, number> = {};
    schoolIds.forEach((id) => {
      counts[id] = 0;
    });

    results.forEach((row: any) => {
      counts[row.schoolId] = parseInt(row.count, 10);
    });

    return counts;
  }

  /**
   * Get unique programs count by school IDs
   */
  private async getUniqueProgramsBySchools(
    schoolIds: string[],
  ): Promise<Record<string, number>> {
    const enrollments = await this.enrollmentRepository.find({
      where: {
        schoolId: In(schoolIds),
        status: EnrollmentStatus.ACTIVE,
      },
      select: ['schoolId', 'program'],
    });

    const programsBySchool: Record<string, Set<string>> = {};
    schoolIds.forEach((id) => {
      programsBySchool[id] = new Set();
    });

    enrollments.forEach((enrollment) => {
      if (enrollment.program) {
        programsBySchool[enrollment.schoolId].add(enrollment.program);
      }
    });

    const result: Record<string, number> = {};
    Object.keys(programsBySchool).forEach((schoolId) => {
      result[schoolId] = programsBySchool[schoolId].size;
    });

    return result;
  }

  /**
   * Get transaction sums by school IDs
   */
  private async getTransactionSumsBySchools(
    schoolIds: string[],
  ): Promise<Record<string, number>> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.schoolId', 'schoolId')
      .addSelect('SUM(transaction.amount)', 'sum')
      .where('transaction.schoolId IN (:...schoolIds)', { schoolIds })
      .andWhere('transaction.status IN (:...statuses)', {
        statuses: ['completed', 'paid', 'succeeded'],
      })
      .groupBy('transaction.schoolId');

    const results = await queryBuilder.getRawMany();

    const sums: Record<string, number> = {};
    schoolIds.forEach((id) => {
      sums[id] = 0;
    });

    results.forEach((row: any) => {
      sums[row.schoolId] = parseInt(row.sum || '0', 10);
    });

    return sums;
  }

  /**
   * Get lead conversion data by school IDs
   */
  private async getLeadConversionBySchools(
    schoolIds: string[],
  ): Promise<Record<string, { total: number; converted: number }>> {
    const allLeads = await this.leadRepository.find({
      where: {
        schoolId: In(schoolIds),
      },
      select: ['schoolId', 'leadStatus'],
    });

    const leadData: Record<string, { total: number; converted: number }> = {};
    schoolIds.forEach((id) => {
      leadData[id] = { total: 0, converted: 0 };
    });

    allLeads.forEach((lead) => {
      if (!leadData[lead.schoolId]) {
        leadData[lead.schoolId] = { total: 0, converted: 0 };
      }
      leadData[lead.schoolId].total++;
      // Check if lead is converted (status = "registered" or CONVERTED)
      if (
        lead.leadStatus === LeadStatus.CONVERTED ||
        lead.leadStatus === LeadStatus.REGISTERED
      ) {
        leadData[lead.schoolId].converted++;
      }
    });

    return leadData;
  }

  /**
   * Analyze retention risks for a school
   */
  async analyzeRetentionRisks(schoolId: string): Promise<any> {
    this.logger.log(`Analyzing retention risks for school: ${schoolId}`);

    // Fetch active enrollments with lead data
    const enrollments = await this.enrollmentRepository.find({
      where: {
        schoolId,
        status: EnrollmentStatus.ACTIVE,
      },
      relations: ['lead'],
      order: {
        createdAt: 'DESC',
      },
    });

    if (enrollments.length === 0) {
      return {
        success: true,
        analysis: {
          overallHealth: {
            retentionScore: 100,
            totalFamilies: 0,
            atRiskCount: 0,
            healthStatus: 'excellent',
            trendDirection: 'stable',
          },
          atRiskFamilies: [],
          riskPatterns: {
            paymentRelated: 0,
            engagementRelated: 0,
            newFamilyRisk: 0,
            communicationGaps: 0,
          },
          strategicRecommendations: [],
          analysis: {
            timestamp: new Date().toISOString(),
            familiesAnalyzed: 0,
            dataQuality: 'insufficient_data',
          },
        },
      };
    }

    // Fetch payment/transaction data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await this.transactionRepository.find({
      where: {
        schoolId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 500,
    });

    // Prepare analysis data
    const analysisData = {
      totalEnrollments: enrollments.length,
      enrollments: enrollments.map((e) => ({
        enrollmentId: e.id,
        leadId: e.leadId,
        childName: e.lead?.childName || 'Unknown',
        parentName: e.lead?.parentName || 'Unknown',
        parentEmail: e.lead?.parentEmail || '',
        parentPhone: e.lead?.parentPhone || '',
        childBirthdate: e.lead?.childBirthdate?.toISOString() || null,
        program: e.program,
        startDate: e.startDate?.toISOString() || null,
        enrollmentAge: e.startDate
          ? Math.floor((Date.now() - new Date(e.startDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        daysSinceLastActivity: e.lead?.lastActivityAt
          ? Math.floor((Date.now() - new Date(e.lead.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
      paymentSummary: {
        totalPayments: transactions.length,
        failedPayments: transactions.filter((t) => t.status === 'failed').length,
        latePayments: transactions.filter(
          (t) => t.status === 'pending' && t.createdAt < new Date(),
        ).length,
        pendingPayments: transactions.filter((t) => t.status === 'pending').length,
      },
      recentTransactions: transactions.slice(0, 50).map((t) => ({
        type: t.paymentType,
        status: t.status,
        amount: t.amount,
        date: t.createdAt.toISOString(),
      })),
    };

    // Call OpenAI API
    const openAIApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new BadRequestException('OpenAI API key not configured');
    }

    const prompt = `You are an expert in childcare center retention and family engagement analysis. Analyze the following data to identify families at risk of withdrawal.

ENROLLMENT DATA:
${JSON.stringify(analysisData, null, 2)}

Identify families at risk of withdrawal based on:
1. Payment patterns (late payments, failed payments, payment frequency issues)
2. Engagement levels (days since last activity, communication frequency)
3. Enrollment duration (new families are at higher risk in first 90 days)
4. Historical patterns and red flags

For each at-risk family, provide:
- Risk score (0-100, where 100 is highest risk)
- Risk level (low, medium, high, critical)
- Primary risk factors (list specific issues)
- Recommended actions (specific steps to retain the family)
- Urgency (how soon to act: immediate, this_week, this_month)

Also provide:
- Overall retention health score for the school (0-100)
- Summary of key risk patterns across all families
- Strategic retention recommendations for the school

Return ONLY valid JSON in this exact structure:
{
  "overallHealth": {
    "retentionScore": number,
    "totalFamilies": number,
    "atRiskCount": number,
    "healthStatus": "excellent" | "good" | "fair" | "poor",
    "trendDirection": "improving" | "stable" | "declining"
  },
  "atRiskFamilies": [
    {
      "enrollmentId": "uuid",
      "childName": "string",
      "parentName": "string",
      "parentEmail": "string",
      "parentPhone": "string",
      "riskScore": number,
      "riskLevel": "low" | "medium" | "high" | "critical",
      "primaryRiskFactors": ["string"],
      "paymentIssues": "string",
      "engagementIssues": "string",
      "recommendedActions": ["string"],
      "urgency": "immediate" | "this_week" | "this_month",
      "estimatedWithdrawalWindow": "string"
    }
  ],
  "riskPatterns": {
    "paymentRelated": number,
    "engagementRelated": number,
    "newFamilyRisk": number,
    "communicationGaps": number
  },
  "strategicRecommendations": [
    {
      "category": "string",
      "recommendation": "string",
      "expectedImpact": "high" | "medium" | "low"
    }
  ],
  "analysis": {
    "timestamp": "ISO string",
    "familiesAnalyzed": number,
    "dataQuality": "excellent" | "good" | "fair" | "limited"
  }
}`;

    this.logger.log('Calling OpenAI API for retention risk analysis...');

    try {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert childcare center retention analyst. Analyze enrollment and payment data to identify families at risk of withdrawal. Always respond with valid JSON only, no markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        }),
      });

      if (!openAIResponse.ok) {
        const errorText = await openAIResponse.text();
        this.logger.error('OpenAI API error:', errorText);
        throw new BadRequestException(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
      }

      const aiData = await openAIResponse.json();
      const analysis = JSON.parse(aiData.choices[0].message.content);

      this.logger.log('Retention risk analysis completed successfully');

      return {
        success: true,
        analysis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error in retention risk analysis:', error);
      throw new BadRequestException(`Failed to analyze retention risks: ${error.message}`);
    }
  }

  /**
   * Get conversion funnel data for a school
   */
  async getConversionFunnelData(
    schoolId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      leadSource?: string;
      program?: string;
      leadStatus?: string;
      minScore?: number;
      maxScore?: number;
      priority?: string;
      admissionStaff?: string;
    },
  ): Promise<ConversionFunnelData[]> {
    this.logger.log(`Fetching conversion funnel data for school: ${schoolId}`);

    const queryBuilder = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.schoolId = :schoolId', { schoolId });

    if (filters?.startDate) {
      queryBuilder.andWhere('lead.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('lead.createdAt <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    if (filters?.leadSource) {
      queryBuilder.andWhere('lead.leadSourceNew = :leadSource', {
        leadSource: filters.leadSource,
      });
    }

    if (filters?.program) {
      queryBuilder.andWhere('lead.programInterest = :program', {
        program: filters.program,
      });
    }

    if (filters?.leadStatus) {
      queryBuilder.andWhere('lead.leadStatus = :leadStatus', {
        leadStatus: filters.leadStatus,
      });
    }

    if (filters?.minScore !== undefined) {
      queryBuilder.andWhere('lead.leadScore >= :minScore', {
        minScore: filters.minScore,
      });
    }

    if (filters?.maxScore !== undefined) {
      queryBuilder.andWhere('lead.leadScore <= :maxScore', {
        maxScore: filters.maxScore,
      });
    }

    if (filters?.priority) {
      queryBuilder.andWhere('lead.urgency = :priority', {
        priority: filters.priority,
      });
    }

    if (filters?.admissionStaff) {
      queryBuilder.andWhere('lead.assignedTo = :admissionStaff', {
        admissionStaff: filters.admissionStaff,
      });
    }

    const totalLeads = await queryBuilder.getCount();

    // Count waitlisted leads
    const waitlistQueryBuilder = this.waitlistRepository
      .createQueryBuilder('waitlist')
      .innerJoin('waitlist.lead', 'lead')
      .where('waitlist.schoolId = :schoolId', { schoolId });

    if (filters?.startDate) {
      waitlistQueryBuilder.andWhere('lead.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters?.endDate) {
      waitlistQueryBuilder.andWhere('lead.createdAt <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    const totalWaitlist = await waitlistQueryBuilder.getCount();

    // Count enrolled leads
    const enrollmentQueryBuilder = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.lead', 'lead')
      .where('enrollment.schoolId = :schoolId', { schoolId })
      .andWhere('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE });

    if (filters?.startDate) {
      enrollmentQueryBuilder.andWhere('lead.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters?.endDate) {
      enrollmentQueryBuilder.andWhere('lead.createdAt <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    const totalEnrolled = await enrollmentQueryBuilder.getCount();

    // Calculate conversion rates
    const leadToWaitlistRate =
      totalLeads > 0 ? (totalWaitlist / totalLeads) * 100 : 0;
    const waitlistToEnrollmentRate =
      totalWaitlist > 0 ? (totalEnrolled / totalWaitlist) * 100 : 0;

    const result: ConversionFunnelData[] = [
      {
        stage: 'leads',
        count: totalLeads,
        conversion_rate: 100.0,
        drop_off_rate: 0.0,
        avg_time_to_next_stage: 0.0,
      },
      {
        stage: 'waitlist',
        count: totalWaitlist,
        conversion_rate: leadToWaitlistRate,
        drop_off_rate:
          totalLeads > 0
            ? ((totalLeads - totalWaitlist) / totalLeads) * 100
            : 0,
        avg_time_to_next_stage: 0.0, // TODO: Calculate average time
      },
      {
        stage: 'enrollment',
        count: totalEnrolled,
        conversion_rate: waitlistToEnrollmentRate,
        drop_off_rate:
          totalWaitlist > 0
            ? ((totalWaitlist - totalEnrolled) / totalWaitlist) * 100
            : 0,
        avg_time_to_next_stage: 0.0, // TODO: Calculate average time
      },
    ];

    return result;
  }

  /**
   * Get campaign conversion data for a school
   */
  async getCampaignConversionData(
    schoolId: string,
  ): Promise<CampaignConversionData[]> {
    this.logger.log(`Fetching campaign conversion data for school: ${schoolId}`);

    const campaigns = await this.campaignRepository.find({
      where: {
        schoolId,
        status: In([CampaignStatus.COMPLETED, CampaignStatus.ACTIVE]),
      },
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });

    const result: CampaignConversionData[] = [];

    for (const campaign of campaigns) {
      // Get campaign recipients
      const recipients = await this.campaignRecipientRepository.find({
        where: { campaignId: campaign.id },
        relations: ['lead'],
      });

      const totalSent = recipients.length;
      const leadsGenerated = recipients.filter((r) => r.lead).length;

      // Count waitlist conversions (leads that went to waitlist after campaign)
      const waitlistConversions = await this.waitlistRepository
        .createQueryBuilder('waitlist')
        .innerJoin('waitlist.lead', 'lead')
        .where('waitlist.schoolId = :schoolId', { schoolId })
        .andWhere('lead.id IN (:...leadIds)', {
          leadIds: recipients.map((r) => r.leadId),
        })
        .andWhere('waitlist.createdAt >= :campaignSentAt', {
          campaignSentAt: campaign.sentAt || campaign.createdAt,
        })
        .getCount();

      // Count enrollment conversions
      const enrollmentConversions = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .innerJoin('enrollment.lead', 'lead')
        .where('enrollment.schoolId = :schoolId', { schoolId })
        .andWhere('lead.id IN (:...leadIds)', {
          leadIds: recipients.map((r) => r.leadId),
        })
        .andWhere('enrollment.createdAt >= :campaignSentAt', {
          campaignSentAt: campaign.sentAt || campaign.createdAt,
        })
        .getCount();

      const leadConversionRate =
        totalSent > 0 ? (leadsGenerated / totalSent) * 100 : 0;
      const waitlistConversionRate =
        leadsGenerated > 0 ? (waitlistConversions / leadsGenerated) * 100 : 0;
      const enrollmentConversionRate =
        waitlistConversions > 0
          ? (enrollmentConversions / waitlistConversions) * 100
          : 0;

      result.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        total_sent: totalSent,
        leads_generated: leadsGenerated,
        waitlist_conversions: waitlistConversions,
        enrollment_conversions: enrollmentConversions,
        lead_conversion_rate: leadConversionRate,
        waitlist_conversion_rate: waitlistConversionRate,
        enrollment_conversion_rate: enrollmentConversionRate,
      });
    }

    return result;
  }
}

