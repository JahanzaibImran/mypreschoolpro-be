import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolEntity, SchoolStatus, SchoolSubscriptionStatus } from './entities/school.entity';
import { SchoolAnalytics } from './entities/school-analytics.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { ConfigService } from '@nestjs/config';
import { ClassEntity } from '../classes/entities/class.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { Waitlist } from '../enrollment/entities/waitlist.entity';

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
    @InjectRepository(SchoolAnalytics)
    private readonly schoolAnalyticsRepository: Repository<SchoolAnalytics>,
    @InjectRepository(ClassEntity)
    private readonly classRepository: Repository<ClassEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
    @InjectRepository(Waitlist)
    private readonly waitlistRepository: Repository<Waitlist>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new school
   */
  async create(createSchoolDto: CreateSchoolDto, ownerId?: string): Promise<SchoolEntity> {
    this.logger.log(`Creating school: ${createSchoolDto.name}`);

    const school = this.schoolRepository.create({
      ...createSchoolDto,
      ownerId: ownerId || createSchoolDto.ownerId || null,
      status: createSchoolDto.status || SchoolStatus.ACTIVE,
      subscriptionStatus: createSchoolDto.subscriptionStatus || SchoolSubscriptionStatus.ACTIVE,
      programsOffered: createSchoolDto.programsOffered ?? [],
      capacity: createSchoolDto.capacity ?? 0,
      subscriptionAmount: createSchoolDto.subscriptionAmount ?? 70000,
      paidInAdvancePeriod: createSchoolDto.paidInAdvancePeriod ?? 0,
      discountedAmount: createSchoolDto.discountedAmount ?? null,
      accessDisabled: createSchoolDto.accessDisabled ?? false,
      paymentRetryCount: createSchoolDto.paymentRetryCount ?? 0,
      nextPaymentDue: createSchoolDto.nextPaymentDue ? new Date(createSchoolDto.nextPaymentDue) : null,
      lastPaymentDate: createSchoolDto.lastPaymentDate ? new Date(createSchoolDto.lastPaymentDate) : null,
    });

    return this.schoolRepository.save(school);
  }

  /**
   * Find all schools with optional filtering
   */
  async findAll(options?: {
    status?: SchoolStatus;
    ownerId?: string;
    schoolId?: string;
    limit?: number;
    offset?: number;
    order?: 'ASC' | 'DESC';
  }): Promise<{ data: SchoolEntity[]; total: number }> {
    const { status, ownerId, schoolId, limit = 100, offset = 0, order = 'DESC' } = options || {};

    const queryBuilder = this.schoolRepository.createQueryBuilder('school');

    if (status) {
      queryBuilder.where('school.status = :status', { status });
    }

    if (ownerId) {
      queryBuilder.andWhere('school.owner_id = :ownerId', { ownerId });
    }

    if (schoolId) {
      queryBuilder.andWhere('school.id = :schoolId', { schoolId });
    }

    queryBuilder
      .orderBy('school.created_at', order)
      .skip(offset)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Get count of schools with optional filtering
   */
  async getCount(options?: {
    status?: SchoolStatus;
    ownerId?: string;
    schoolId?: string;
  }): Promise<number> {
    const { status, ownerId, schoolId } = options || {};

    const queryBuilder = this.schoolRepository.createQueryBuilder('school');

    if (status) {
      queryBuilder.where('school.status = :status', { status });
    }

    if (ownerId) {
      queryBuilder.andWhere('school.owner_id = :ownerId', { ownerId });
    }

    if (schoolId) {
      queryBuilder.andWhere('school.id = :schoolId', { schoolId });
    }

    return queryBuilder.getCount();
  }

  /**
   * Find a school by ID
   */
  async findOne(id: string): Promise<SchoolEntity> {
    const school = await this.schoolRepository.findOne({
      where: { id },
    });

    if (!school) {
      throw new NotFoundException(`School with ID "${id}" not found`);
    }

    return school;
  }

  /**
   * Find schools by IDs (returns only id and name)
   * Used for creating school maps in frontend
   */
  async findByIds(ids: string[]): Promise<Array<{ id: string; name: string }>> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const schools = await this.schoolRepository
      .createQueryBuilder('school')
      .select('school.id', 'id')
      .addSelect('school.name', 'name')
      .where('school.id IN (:...ids)', { ids })
      .getRawMany();

    return schools;
  }

  /**
   * Update a school
   */
  async update(id: string, updateSchoolDto: UpdateSchoolDto): Promise<SchoolEntity> {
    this.logger.log(`Updating school: ${id}`);

    const school = await this.findOne(id);

    Object.assign(school, updateSchoolDto);

    if (updateSchoolDto.nextPaymentDue !== undefined) {
      school.nextPaymentDue = updateSchoolDto.nextPaymentDue
        ? new Date(updateSchoolDto.nextPaymentDue)
        : null;
    }

    if (updateSchoolDto.lastPaymentDate !== undefined) {
      school.lastPaymentDate = updateSchoolDto.lastPaymentDate
        ? new Date(updateSchoolDto.lastPaymentDate)
        : null;
    }

    return this.schoolRepository.save(school);
  }

  /**
   * Delete a school (soft delete by setting status to inactive)
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removing school: ${id}`);

    const school = await this.findOne(id);
    school.status = SchoolStatus.INACTIVE;
    await this.schoolRepository.save(school);
  }

  /**
   * Hard delete a school (use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    this.logger.warn(`Hard deleting school: ${id}`);

    const school = await this.findOne(id);
    await this.schoolRepository.remove(school);
  }

  /**
   * Check if a school exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.schoolRepository.count({ where: { id } });
    return count > 0;
  }

  async findNearbySchools(zipCode: string, radiusMiles = 25) {
    const googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new BadRequestException('Google Maps API key not configured');
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      zipCode,
    )}&key=${googleApiKey}`;

    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (
      geocodeData.status !== 'OK' ||
      !geocodeData.results ||
      geocodeData.results.length === 0
    ) {
      throw new BadRequestException('Invalid zip code or geocoding failed');
    }

    const location = geocodeData.results[0].geometry.location;

    const schools = await this.schoolRepository.query(
      `
        SELECT 
          s.*,
          (
            3959 * acos(
              cos(radians($1)) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians($2))
              + sin(radians($1)) * sin(radians(s.latitude))
            )
          ) AS distance
        FROM schools s
        WHERE 
          s.status = 'active'
          AND s.latitude IS NOT NULL
          AND s.longitude IS NOT NULL
          AND (
            3959 * acos(
              cos(radians($1)) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians($2))
              + sin(radians($1)) * sin(radians(s.latitude))
            )
          ) <= $3
        ORDER BY distance ASC
        LIMIT 50
      `,
      [location.lat, location.lng, radiusMiles],
    );

    return {
      location: {
        latitude: location.lat,
        longitude: location.lng,
        zipCode,
      },
      schools,
    };
  }

  /**
   * Get schools by owner ID
   */
  async findByOwner(ownerId: string): Promise<SchoolEntity[]> {
    return this.schoolRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update school status
   */
  async updateStatus(id: string, status: SchoolStatus): Promise<SchoolEntity> {
    this.logger.log(`Updating school ${id} status to ${status}`);

    const school = await this.findOne(id);
    school.status = status;
    return this.schoolRepository.save(school);
  }

  /**
   * Get school name by ID (useful for email templates and other services)
   */
  async getSchoolName(id: string): Promise<string | null> {
    try {
      const school = await this.schoolRepository.findOne({
        where: { id },
        select: ['name'],
      });
      return school?.name || null;
    } catch (error) {
      this.logger.warn(`Failed to get school name for ID ${id}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get multiple school names by IDs
   */
  async getSchoolNames(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) {
      return new Map();
    }

    const schools = await this.schoolRepository.find({
      where: ids.map((id) => ({ id })),
      select: ['id', 'name'],
    });

    const nameMap = new Map<string, string>();
    schools.forEach((school) => {
      nameMap.set(school.id, school.name);
    });

    return nameMap;
  }

  /**
   * Get latest analytics for a school by metric type
   */
  async getLatestAnalytics(schoolId: string, metricType: string): Promise<SchoolAnalytics | null> {
    const analytics = await this.schoolAnalyticsRepository.findOne({
      where: {
        schoolId,
        metricType,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return analytics || null;
  }

  /**
   * Project class sizes for a school over a specified number of months
   * This method replicates the logic from the Supabase edge function
   */
  async projectClassSizes(schoolId: string, projectionMonths: number): Promise<{
    success: boolean;
    projections?: any;
    baselineData?: any;
    error?: string;
  }> {
    this.logger.log(`Projecting class sizes for school ${schoolId} over ${projectionMonths} months`);

    try {
      // Verify school exists
      const school = await this.findOne(schoolId);

      // Fetch current classes
      const classes = await this.classRepository.find({
        where: { schoolId },
        select: ['id', 'name', 'program', 'capacity', 'currentEnrollment', 'ageGroup', 'status'],
      });

      // Fetch enrollment history with lead data (for birthdates)
      const enrollments = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .leftJoinAndSelect('enrollment.lead', 'lead')
        .where('enrollment.schoolId = :schoolId', { schoolId })
        .select([
          'enrollment.id',
          'enrollment.classId',
          'enrollment.startDate',
          'enrollment.endDate',
          'enrollment.status',
          'enrollment.createdAt',
          'lead.childBirthdate',
          'lead.program',
        ])
        .getMany();

      // Calculate historical withdrawal patterns
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const historicalWithdrawals = enrollments.filter(
        (e) => e.endDate && new Date(e.endDate) >= sixMonthsAgo,
      );

      const withdrawalRate =
        enrollments.length > 0 ? (historicalWithdrawals.length / enrollments.length) * 100 : 0;

      // Analyze age transitions
      const today = new Date();
      const ageTransitions = enrollments
        .map((e) => {
          if (!e.lead?.childBirthdate) return null;

          const birthdate = new Date(e.lead.childBirthdate);
          const ageInMonths = Math.floor(
            (today.getTime() - birthdate.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
          );

          return {
            enrollmentId: e.id,
            classId: e.classId,
            currentAgeMonths: ageInMonths,
            program: e.lead.program,
          };
        })
        .filter(Boolean);

      // Fetch waitlist (active waitlist entries)
      const waitlist = await this.waitlistRepository
        .createQueryBuilder('waitlist')
        .where('waitlist.schoolId = :schoolId', { schoolId })
        .andWhere('waitlist.status IN (:...statuses)', {
          statuses: ['waitlisted', 'new'],
        })
        .select(['waitlist.id', 'waitlist.program', 'waitlist.priorityScore', 'waitlist.status'])
        .getMany();

      // Prepare comprehensive data for AI analysis
      const analysisData = {
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          program: c.program,
          capacity: c.capacity || 0,
          currentEnrollment: c.currentEnrollment || 0,
          ageRange: c.ageGroup,
          utilizationRate: ((c.currentEnrollment || 0) / (c.capacity || 1)) * 100,
        })),
        enrollmentTrends: {
          totalActive: enrollments.filter((e) => e.status === 'active').length,
          totalHistorical: enrollments.length,
          sixMonthWithdrawals: historicalWithdrawals.length,
          withdrawalRate: withdrawalRate.toFixed(2),
        },
        ageTransitions,
        waitlistData: {
          totalWaitlist: waitlist.length,
          byProgram: waitlist.reduce((acc: any, w) => {
            acc[w.program] = (acc[w.program] || 0) + 1;
            return acc;
          }, {}),
        },
      };

      // Call OpenAI API for projections
      const openAIApiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!openAIApiKey) {
        throw new BadRequestException('OpenAI API key not configured');
      }

      const prompt = `Analyze enrollment data and project class sizes for the next ${projectionMonths} months.

CURRENT STATE:
${JSON.stringify(analysisData, null, 2)}

PROJECT the following for each month:
1. Expected enrollment per class (accounting for withdrawals, transitions, new enrollments)
2. Classes approaching capacity limits
3. Classes with declining enrollment
4. Recommended staffing levels
5. Space utilization forecasts
6. Risk factors and mitigation strategies

Consider:
- Historical withdrawal rate of ${withdrawalRate.toFixed(1)}%
- Age-based transitions between programs
- Waitlist conversion potential
- Seasonal enrollment patterns
- Capacity constraints

Response must be valid JSON with this structure:
{
  "summary": "Executive summary of enrollment projections",
  "projectionPeriod": "${projectionMonths} months",
  "monthlyProjections": [
    {
      "month": 1,
      "monthName": "Month name",
      "totalProjectedEnrollment": number,
      "classProjections": [
        {
          "classId": "uuid",
          "className": "string",
          "projectedEnrollment": number,
          "capacity": number,
          "utilizationRate": number,
          "netChange": number,
          "expectedWithdrawals": number,
          "expectedNewEnrollments": number,
          "ageOutTransitions": number,
          "staffingNeed": "adequate" | "increase" | "decrease",
          "status": "healthy" | "at-risk" | "critical"
        }
      ],
      "keyInsights": ["insight 1", "insight 2"],
      "recommendations": ["recommendation 1"]
    }
  ],
  "longTermTrends": {
    "growthTrajectory": "growing" | "stable" | "declining",
    "capacityUtilization": "optimal" | "underutilized" | "overcrowded",
    "staffingImplications": "Description of staffing needs",
    "spaceRequirements": "Description of space needs"
  },
  "strategicRecommendations": [
    {
      "priority": "immediate" | "short-term" | "long-term",
      "category": "staffing" | "space" | "enrollment" | "marketing",
      "recommendation": "Specific action",
      "expectedImpact": "Description",
      "timeline": "When to implement"
    }
  ],
  "riskFactors": [
    {
      "risk": "Description of risk",
      "likelihood": "high" | "medium" | "low",
      "impact": "Description of potential impact",
      "mitigation": "How to address it"
    }
  ]
}`;

      this.logger.log('Calling OpenAI API for class size projections...');

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
                'You are an expert enrollment forecasting analyst for childcare and preschool facilities. Analyze enrollment data and create detailed, accurate projections that help administrators make informed decisions about staffing, space, and resources. Always respond with valid JSON only, no markdown formatting.',
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
      const projections = JSON.parse(aiData.choices[0].message.content);

      this.logger.log('Class size projections completed successfully');

      // Store projections in school_analytics
      const analytics = this.schoolAnalyticsRepository.create({
        schoolId,
        metricType: 'class_size_projections',
        metricValue: {
          projections,
          baselineData: analysisData,
          projectedAt: new Date().toISOString(),
          projectionMonths,
        },
      });

      await this.schoolAnalyticsRepository.save(analytics);

      return {
        success: true,
        projections,
        baselineData: analysisData,
      };
    } catch (error) {
      this.logger.error('Error in projectClassSizes:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate class size projections',
      };
    }
  }
}

