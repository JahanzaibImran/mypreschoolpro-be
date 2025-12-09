import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SchoolEntity } from '../schools/entities/school.entity';
import { EnrollmentEntity, EnrollmentStatus } from '../enrollment/entities/enrollment.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { LeadEntity, LeadStatus } from '../leads/entities/lead.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { StaffDocument, StaffDocumentStatus } from '../users/entities/staff-document.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { ProfileEntity } from '../users/entities/profile.entity';
import { AppRole } from '../../common/enums/app-role.enum';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(ClassEntity)
    private readonly classRepository: Repository<ClassEntity>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(StaffDocument)
    private readonly staffDocumentRepository: Repository<StaffDocument>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Call OpenAI API with structured prompt
   */
  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
    model: string = 'gpt-4o-mini',
    temperature: number = 0.4,
    maxTokens: number = 3000,
  ): Promise<any> {
    const openAIApiKey = this.configService.get<string>('openai.apiKey') || 
                        this.configService.get<string>('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new BadRequestException('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('OpenAI API error:', errorText);
        throw new BadRequestException(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      this.logger.error('Error calling OpenAI API:', error);
      throw new BadRequestException(`Failed to call OpenAI API: ${error.message}`);
    }
  }

  /**
   * Analyze billing issues for a school
   */
  async analyzeBillingIssues(schoolId: string): Promise<any> {
    this.logger.log(`Analyzing billing issues for school: ${schoolId}`);

    // Fetch transactions
    const transactions = await this.transactionRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 500,
    });

    // Fetch invoices
    const invoices = await this.invoiceRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    // Fetch payments
    const payments = await this.paymentRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    const dataSummary = {
      totalTransactions: transactions.length,
      totalInvoices: invoices.length,
      totalPayments: payments.length,
      failedTransactions: transactions.filter(t => t.status === 'failed').length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      recentTransactions: transactions.slice(0, 50).map(t => ({
        id: t.id,
        amount: t.amount / 100,
        status: t.status,
        paymentType: t.paymentType,
        userId: t.userId,
        createdAt: t.createdAt,
        metadata: t.metadata,
      })),
      recentInvoices: invoices.slice(0, 30).map(inv => ({
        id: inv.id,
        amount: inv.amount / 100,
        status: inv.status,
        dueDate: inv.dueDate,
        paymentDate: inv.paymentDate,
        createdAt: inv.createdAt,
      })),
      recentPayments: payments.slice(0, 30).map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.paymentStatus,
        paymentType: p.paymentType,
        paymentMethod: p.paymentMethod,
        transactionId: p.transactionId,
        createdAt: p.createdAt,
      })),
    };

    const systemPrompt = 'You are a financial auditor specializing in billing error detection. Analyze payment data and provide detailed findings in valid JSON format only.';
    
    const userPrompt = `Analyze the following payment and transaction data to identify issues.

Data Summary:
- Total Transactions: ${dataSummary.totalTransactions}
- Total Invoices: ${dataSummary.totalInvoices}
- Failed Transactions: ${dataSummary.failedTransactions}
- Pending Transactions: ${dataSummary.pendingTransactions}

Recent Transactions:
${JSON.stringify(dataSummary.recentTransactions, null, 2)}

Recent Invoices:
${JSON.stringify(dataSummary.recentInvoices, null, 2)}

Recent Payments:
${JSON.stringify(dataSummary.recentPayments, null, 2)}

Analyze for:
1. Duplicate Drafts: Same amount, same user, within 5 minutes
2. Failed ACH Payments: Transactions with status='failed' and payment_type containing 'ach'
3. Missing Credits: Invoices marked as 'paid' but no corresponding transaction
4. Inconsistencies: Invoices with payment_date but status still 'pending'
5. Orphaned Records: Transactions with no matching invoices
6. Amount Mismatches: Invoice amounts not matching transaction amounts

Return JSON with structure:
{
  "overallStatus": "critical" | "warning" | "clean",
  "summary": "brief overview",
  "duplicateDrafts": [{"transactionIds": [], "amount": number, "userId": string, "severity": string, "recommendation": string}],
  "failedACHPayments": [{"transactionId": string, "amount": number, "failedDate": string, "recommendation": string}],
  "missingCredits": [{"invoiceId": string, "amount": number, "issueType": string, "description": string, "recommendation": string}],
  "inconsistencies": [{"type": string, "recordId": string, "description": string, "severity": string, "recommendation": string}],
  "financialImpact": {"potentialOvercharges": number, "unrealizedRevenue": number, "failedPaymentsTotal": number, "affectedCustomers": number},
  "recommendations": ["prioritized actions"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini', 0.3);

    return {
      success: true,
      analysis,
      metadata: {
        transactionsAnalyzed: dataSummary.totalTransactions,
        invoicesAnalyzed: dataSummary.totalInvoices,
        paymentsAnalyzed: dataSummary.totalPayments,
      },
    };
  }

  /**
   * Analyze class insights
   */
  async analyzeClassInsights(schoolId: string, classId: string): Promise<any> {
    this.logger.log(`Analyzing class insights for class: ${classId}`);

    const classData = await this.classRepository.findOne({ where: { id: classId, schoolId } });
    if (!classData) {
      throw new BadRequestException('Class not found');
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { classId, status: EnrollmentStatus.ACTIVE },
      relations: ['lead'],
    });

    const interestedLeads = await this.leadRepository.find({
      where: {
        schoolId,
        program: classData.program || undefined,
        leadStatus: In([
          LeadStatus.NEW,
          LeadStatus.CONTACTED,
          LeadStatus.INTERESTED,
          LeadStatus.TOURED,
          LeadStatus.APPROVED_FOR_REGISTRATION,
          LeadStatus.WAITLISTED,
        ]),
      },
      order: { leadScore: 'DESC', createdAt: 'ASC' },
    });

    const availableSpots = (classData.capacity || 0) - (classData.currentEnrollment || 0);
    const interestedCount = interestedLeads.length;

    const systemPrompt = 'You are an education enrollment analyst. Analyze class and enrollment data and provide actionable insights. Always respond with valid JSON only.';
    
    const userPrompt = `Analyze the following class and enrollment data:

Class Data:
- Name: ${classData.name}
- Program: ${classData.program}
- Age Group: ${classData.ageGroup}
- Capacity: ${classData.capacity}
- Current Enrollment: ${classData.currentEnrollment}
- Available Spots: ${availableSpots}

Enrollment Data:
- Active Enrollments: ${enrollments.length}
- Interested Leads: ${interestedCount}

Provide insights on:
1. Enrollment trends and patterns
2. Capacity utilization
3. Lead conversion opportunities
4. Recommendations for filling spots
5. Program demand analysis

Return JSON with structure:
{
  "enrollmentHealth": {"score": number, "status": string, "utilizationRate": number},
  "insights": ["key insights"],
  "opportunities": [{"type": string, "description": string, "priority": string}],
  "recommendations": ["actionable recommendations"],
  "leadAnalysis": {"qualifiedLeads": number, "conversionPotential": string}
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
      classData: {
        id: classData.id,
        name: classData.name,
        capacity: classData.capacity,
        currentEnrollment: classData.currentEnrollment,
        availableSpots,
      },
    };
  }

  /**
   * Analyze lead priority
   */
  async analyzeLeadPriority(leadId: string, schoolId: string): Promise<any> {
    this.logger.log(`Analyzing lead priority for lead: ${leadId}`);

    const lead = await this.leadRepository.findOne({
      where: { id: leadId, schoolId },
    });

    if (!lead) {
      throw new BadRequestException('Lead not found');
    }

    const conversions = await this.leadRepository.find({
      where: {
        schoolId,
        leadStatus: In(['enrolled', 'registered']),
      },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const daysSinceInquiry = Math.floor(
      (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const systemPrompt = 'You are a lead qualification expert. Analyze lead data to determine priority and conversion likelihood. Always respond with valid JSON only.';
    
    const userPrompt = `Analyze this lead for priority scoring:

Lead Data:
${JSON.stringify({
  id: lead.id,
  childName: lead.childName,
  parentName: lead.parentName,
  program: lead.program,
  leadStatus: lead.leadStatus,
  leadScore: lead.leadScore,
  leadSource: lead.leadSource,
  daysSinceInquiry,
  lastActivityAt: lead.lastActivityAt,
}, null, 2)}

Historical Conversion Data:
- Total Conversions: ${conversions.length}
- Average Conversion Time: Calculate from conversions

Provide:
1. Priority score (0-100)
2. Conversion likelihood (high/medium/low)
3. Key factors affecting priority
4. Recommended next actions
5. Urgency level

Return JSON:
{
  "priorityScore": number,
  "conversionLikelihood": "high" | "medium" | "low",
  "keyFactors": [{"factor": string, "impact": string}],
  "recommendedActions": ["actions"],
  "urgency": "immediate" | "this_week" | "this_month",
  "estimatedConversionWindow": string
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
      leadId: lead.id,
    };
  }

  /**
   * Predict payment risks
   */
  async predictPaymentRisks(schoolId: string): Promise<any> {
    this.logger.log(`Predicting payment risks for school: ${schoolId}`);

    const payments = await this.paymentRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    const transactions = await this.transactionRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    const enrollments = await this.enrollmentRepository.find({
      where: { schoolId, status: EnrollmentStatus.ACTIVE },
      relations: ['lead'],
    });

    const systemPrompt = 'You are a financial risk analyst specializing in payment prediction. Analyze payment patterns to predict future payment risks. Always respond with valid JSON only.';
    
    const userPrompt = `Analyze payment data to predict payment risks:

Payment History:
${JSON.stringify(payments.slice(0, 50).map(p => ({
  amount: p.amount,
  paymentStatus: p.paymentStatus,
  paymentType: p.paymentType,
  createdAt: p.createdAt,
})), null, 2)}

Transaction History:
${JSON.stringify(transactions.slice(0, 50).map(t => ({
  amount: t.amount / 100,
  status: t.status,
  paymentType: t.paymentType,
  createdAt: t.createdAt,
})), null, 2)}

Active Enrollments: ${enrollments.length}

Identify:
1. Families at risk of payment issues
2. Payment pattern trends
3. Risk factors and indicators
4. Predicted payment failures
5. Recommendations for risk mitigation

Return JSON:
{
  "overallRiskScore": number,
  "atRiskFamilies": [{"enrollmentId": string, "riskScore": number, "riskFactors": [], "predictedIssue": string}],
  "riskPatterns": {"latePayments": number, "failedPayments": number, "decliningTrend": boolean},
  "predictions": {"nextMonthFailures": number, "highRiskCount": number},
  "recommendations": ["mitigation strategies"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
      metadata: {
        paymentsAnalyzed: payments.length,
        transactionsAnalyzed: transactions.length,
        activeEnrollments: enrollments.length,
      },
    };
  }

  /**
   * Predict revenue
   */
  async predictRevenue(schoolId: string, projectionMonths: number = 12): Promise<any> {
    this.logger.log(`Predicting revenue for school: ${schoolId} for ${projectionMonths} months`);

    const enrollments = await this.enrollmentRepository.find({
      where: { schoolId, status: EnrollmentStatus.ACTIVE },
      relations: ['lead'],
    });

    const transactions = await this.transactionRepository.find({
      where: { schoolId, status: PaymentStatus.PAID },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const systemPrompt = 'You are a revenue forecasting expert. Analyze enrollment and transaction data to predict future revenue. Always respond with valid JSON only.';
    
    const userPrompt = `Predict revenue for the next ${projectionMonths} months:

Current Enrollments: ${enrollments.length}
Monthly Tuition Data:
${JSON.stringify(enrollments.slice(0, 20).map(e => ({
  tuitionAmount: e.tuitionAmount,
  program: e.program,
  startDate: e.startDate,
})), null, 2)}

Historical Transactions:
${JSON.stringify(transactions.slice(0, 30).map(t => ({
  amount: t.amount / 100,
  createdAt: t.createdAt,
})), null, 2)}

Provide:
1. Monthly revenue projections
2. Growth trends
3. Factors affecting revenue
4. Confidence intervals
5. Recommendations

Return JSON:
{
  "projections": [{"month": string, "predictedRevenue": number, "confidence": string}],
  "totalProjectedRevenue": number,
  "growthRate": number,
  "factors": [{"factor": string, "impact": string}],
  "recommendations": ["revenue optimization strategies"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini', 0.4, 4000);

    return {
      success: true,
      analysis,
      projectionMonths,
    };
  }

  /**
   * Forecast enrollment trends
   */
  async forecastEnrollmentTrends(schoolId: string, timeframeMonths: number = 12): Promise<any> {
    this.logger.log(`Forecasting enrollment trends for school: ${schoolId}`);

    const enrollments = await this.enrollmentRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 500,
    });

    const leads = await this.leadRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    const classes = await this.classRepository.find({
      where: { schoolId },
    });

    const systemPrompt = 'You are an enrollment forecasting expert. Analyze enrollment trends and predict future enrollment patterns. Always respond with valid JSON only.';
    
    const userPrompt = `Forecast enrollment trends for the next ${timeframeMonths} months:

Historical Enrollments: ${enrollments.length}
Recent Leads: ${leads.length}
Classes: ${classes.length}

Enrollment History:
${JSON.stringify(enrollments.slice(0, 50).map(e => ({
  program: e.program,
  startDate: e.startDate,
  status: e.status,
})), null, 2)}

Provide:
1. Monthly enrollment projections
2. Program-specific trends
3. Capacity utilization forecasts
4. Seasonal patterns
5. Recommendations

Return JSON:
{
  "monthlyProjections": [{"month": string, "predictedEnrollments": number, "programBreakdown": {}}],
  "trends": {"direction": string, "growthRate": number},
  "capacityForecast": {"utilizationRate": number, "availableSpots": number},
  "seasonalPatterns": ["patterns"],
  "recommendations": ["enrollment strategies"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini', 0.4, 4000);

    return {
      success: true,
      analysis,
      timeframeMonths,
    };
  }

  /**
   * Predict class openings
   */
  async predictClassOpenings(schoolId: string, timeframeMonths: number = 12): Promise<any> {
    this.logger.log(`Predicting class openings for school: ${schoolId}`);

    const classes = await this.classRepository.find({
      where: { schoolId },
    });

    const enrollments = await this.enrollmentRepository.find({
      where: { schoolId, status: EnrollmentStatus.ACTIVE },
      relations: ['lead'],
    });

    const historicalWithdrawals = await this.enrollmentRepository.find({
      where: {
        schoolId,
        status: EnrollmentStatus.WITHDRAWN,
      },
      order: { endDate: 'DESC' },
      take: 100,
    });

    const systemPrompt = 'You are an expert in predicting class capacity and openings. Analyze enrollment patterns to predict when classes will have openings. Always respond with valid JSON only.';
    
    const userPrompt = `Predict class openings for the next ${timeframeMonths} months:

Classes:
${JSON.stringify(classes.map(c => ({
  id: c.id,
  name: c.name,
  program: c.program,
  capacity: c.capacity,
  currentEnrollment: c.currentEnrollment,
})), null, 2)}

Active Enrollments: ${enrollments.length}
Historical Withdrawals: ${historicalWithdrawals.length}

Provide:
1. Predicted openings by class
2. Timeline for openings
3. Factors affecting openings
4. Recommendations for waitlist management

Return JSON:
{
  "classOpenings": [{"classId": string, "className": string, "predictedOpenings": [{"month": string, "spots": number, "confidence": string}]}],
  "overallTrend": {"totalOpenings": number, "peakMonths": []},
  "factors": [{"factor": string, "impact": string}],
  "recommendations": ["waitlist strategies"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini', 0.4, 4000);

    return {
      success: true,
      analysis,
      timeframeMonths,
    };
  }

  /**
   * Analyze tour insights
   */
  async analyzeTourInsights(leadId: string): Promise<any> {
    this.logger.log(`Analyzing tour insights for lead: ${leadId}`);

    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: ['school'],
    });

    if (!lead) {
      throw new BadRequestException('Lead not found');
    }

    // Note: lead_activities table would need to be queried here
    // For now, using lead data

    const systemPrompt = 'You are a tour analysis expert. Analyze tour data and lead interactions to provide insights. Always respond with valid JSON only.';
    
    const userPrompt = `Analyze tour insights for this lead:

Lead Data:
${JSON.stringify({
  childName: lead.childName,
  parentName: lead.parentName,
  program: lead.program,
  leadStatus: lead.leadStatus,
  notes: lead.notes,
  createdAt: lead.createdAt,
}, null, 2)}

Provide:
1. Tour effectiveness analysis
2. Engagement level assessment
3. Conversion likelihood
4. Key talking points
5. Follow-up recommendations

Return JSON:
{
  "tourEffectiveness": {"score": number, "assessment": string},
  "engagementLevel": "high" | "medium" | "low",
  "conversionLikelihood": number,
  "keyInsights": ["insights"],
  "recommendations": ["follow-up actions"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
      leadId: lead.id,
    };
  }

  /**
   * Analyze class ratios
   */
  async analyzeClassRatios(schoolId: string): Promise<any> {
    this.logger.log(`Analyzing class ratios for school: ${schoolId}`);

    const classes = await this.classRepository.find({
      where: { schoolId },
    });

    const enrollments = await this.enrollmentRepository.find({
      where: { schoolId, status: EnrollmentStatus.ACTIVE },
    });

    const systemPrompt = 'You are an expert in early childhood education ratios and compliance. Analyze class ratios and capacity. Always respond with valid JSON only.';
    
    const userPrompt = `Analyze class ratios:

Classes:
${JSON.stringify(classes.map(c => ({
  name: c.name,
  program: c.program,
  ageGroup: c.ageGroup,
  capacity: c.capacity,
  currentEnrollment: c.currentEnrollment,
  ratio: (c.currentEnrollment || 0) / (c.capacity || 1),
})), null, 2)}

Provide:
1. Ratio compliance status
2. Optimal capacity recommendations
3. Staffing needs
4. Compliance risks
5. Recommendations

Return JSON:
{
  "complianceStatus": {"overall": string, "classes": [{"classId": string, "status": string}]},
  "optimalRatios": [{"classId": string, "recommendedCapacity": number}],
  "staffingNeeds": {"additionalStaff": number, "recommendations": []},
  "complianceRisks": [{"risk": string, "severity": string}],
  "recommendations": ["action items"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
    };
  }

  /**
   * Analyze multi-school KPIs
   */
  async analyzeMultiSchoolKPIs(schoolIds: string[]): Promise<any> {
    this.logger.log(`Analyzing multi-school KPIs for ${schoolIds.length} schools`);

    const schools = await this.schoolRepository.find({
      where: { id: In(schoolIds) },
    });

    const enrollments = await this.enrollmentRepository.find({
      where: { schoolId: In(schoolIds) },
    });

    const transactions = await this.transactionRepository.find({
      where: { schoolId: In(schoolIds), status: PaymentStatus.PAID },
    });

    const systemPrompt = 'You are a multi-school analytics expert. Compare and analyze KPIs across multiple schools. Always respond with valid JSON only.';
    
    const userPrompt = `Analyze KPIs across multiple schools:

Schools: ${schools.length}
Total Enrollments: ${enrollments.length}
Total Revenue: ${transactions.reduce((sum, t) => sum + t.amount / 100, 0)}

School Breakdown:
${JSON.stringify(schools.map(s => ({
  id: s.id,
  name: s.name,
  enrollments: enrollments.filter(e => e.schoolId === s.id).length,
  revenue: transactions.filter(t => t.schoolId === s.id).reduce((sum, t) => sum + t.amount / 100, 0),
})), null, 2)}

Provide:
1. Comparative analysis
2. Top performers
3. Areas for improvement
4. Benchmarking insights
5. Strategic recommendations

Return JSON:
{
  "comparativeAnalysis": {"topPerformer": string, "improvementAreas": []},
  "benchmarks": {"averageEnrollment": number, "averageRevenue": number},
  "insights": ["key insights"],
  "recommendations": ["strategic actions"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini', 0.4, 4000);

    return {
      success: true,
      analysis,
      schoolsAnalyzed: schoolIds.length,
    };
  }

  /**
   * Recommend next steps for a lead
   */
  async recommendNextSteps(leadId: string, schoolId: string): Promise<any> {
    this.logger.log(`Recommending next steps for lead: ${leadId}`);

    const lead = await this.leadRepository.findOne({
      where: { id: leadId, schoolId },
    });

    if (!lead) {
      throw new BadRequestException('Lead not found');
    }

    const systemPrompt = 'You are a lead management expert. Analyze lead data and recommend the best next steps. Always respond with valid JSON only.';
    
    const userPrompt = `Recommend next steps for this lead:

Lead Data:
${JSON.stringify({
  childName: lead.childName,
  parentName: lead.parentName,
  program: lead.program,
  leadStatus: lead.leadStatus,
  leadScore: lead.leadScore,
  notes: lead.notes,
  createdAt: lead.createdAt,
}, null, 2)}

Provide:
1. Immediate next steps
2. Short-term actions
3. Long-term strategy
4. Communication recommendations
5. Timeline

Return JSON:
{
  "immediateSteps": [{"action": string, "priority": string, "timeline": string}],
  "shortTermActions": [{"action": string, "description": string}],
  "longTermStrategy": {"strategy": string, "goals": []},
  "communicationPlan": [{"type": string, "message": string, "timing": string}],
  "timeline": {"nextWeek": [], "nextMonth": []}
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
      leadId: lead.id,
    };
  }

  /**
   * Recommend program assignments
   */
  async recommendProgramAssignments(leadId: string, schoolId: string): Promise<any> {
    this.logger.log(`Recommending program assignments for lead: ${leadId}`);

    const lead = await this.leadRepository.findOne({
      where: { id: leadId, schoolId },
    });

    if (!lead) {
      throw new BadRequestException('Lead not found');
    }

    const classes = await this.classRepository.find({
      where: { schoolId },
    });

    const systemPrompt = 'You are a program placement expert. Recommend the best program assignment for a child based on their age, needs, and available programs. Always respond with valid JSON only.';
    
    const userPrompt = `Recommend program assignment:

Child Data:
${JSON.stringify({
  childName: lead.childName,
  childBirthdate: lead.childBirthdate,
  program: lead.program,
  notes: lead.notes,
}, null, 2)}

Available Classes:
${JSON.stringify(classes.map(c => ({
  name: c.name,
  program: c.program,
  ageGroup: c.ageGroup,
  capacity: c.capacity,
  currentEnrollment: c.currentEnrollment,
})), null, 2)}

Provide:
1. Recommended program
2. Alternative options
3. Rationale
4. Fit score
5. Next steps

Return JSON:
{
  "recommendedProgram": {"program": string, "classId": string, "fitScore": number, "rationale": string},
  "alternatives": [{"program": string, "classId": string, "fitScore": number}],
  "considerations": ["factors"],
  "nextSteps": ["actions"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
      leadId: lead.id,
    };
  }

  /**
   * Recommend learning path
   */
  async recommendLearningPath(studentData: any, progressData: any, enrollmentData: any): Promise<any> {
    this.logger.log('Recommending learning path');

    const systemPrompt = 'You are an expert early childhood education specialist. Create personalized learning recommendations. Always respond with valid JSON only.';
    
    const userPrompt = `Create personalized learning path:

Student Data:
${JSON.stringify(studentData, null, 2)}

Progress Data:
${JSON.stringify(progressData, null, 2)}

Enrollment Data:
${JSON.stringify(enrollmentData, null, 2)}

Provide:
1. Learning objectives
2. Activity recommendations
3. Skill development areas
4. Timeline
5. Assessment recommendations

Return JSON:
{
  "learningObjectives": [{"objective": string, "domain": string, "timeline": string}],
  "activities": [{"activity": string, "type": string, "duration": string, "materials": []}],
  "skillAreas": [{"area": string, "currentLevel": string, "targetLevel": string, "activities": []}],
  "timeline": {"weeks": [{"week": number, "focus": string, "activities": []}]},
  "assessments": [{"type": string, "frequency": string, "focus": []}]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini', 0.5, 4000);

    return {
      success: true,
      analysis,
    };
  }

  /**
   * Recommend classroom expansion
   */
  async recommendClassroomExpansion(schoolId: string): Promise<any> {
    this.logger.log(`Recommending classroom expansion for school: ${schoolId}`);

    const classes = await this.classRepository.find({
      where: { schoolId },
    });

    const enrollments = await this.enrollmentRepository.find({
      where: { schoolId, status: EnrollmentStatus.ACTIVE },
    });

    const waitlist = await this.leadRepository.find({
      where: {
        schoolId,
        leadStatus: LeadStatus.WAITLISTED,
      },
    });

    const systemPrompt = 'You are a facility planning expert. Analyze capacity and demand to recommend classroom expansion. Always respond with valid JSON only.';
    
    const userPrompt = `Recommend classroom expansion:

Current Classes:
${JSON.stringify(classes.map(c => ({
  name: c.name,
  program: c.program,
  capacity: c.capacity,
  currentEnrollment: c.currentEnrollment,
  utilization: ((c.currentEnrollment || 0) / (c.capacity || 1)) * 100,
})), null, 2)}

Active Enrollments: ${enrollments.length}
Waitlist: ${waitlist.length}

Provide:
1. Expansion recommendations
2. Priority areas
3. Capacity analysis
4. ROI considerations
5. Implementation timeline

Return JSON:
{
  "recommendations": [{"program": string, "currentCapacity": number, "recommendedCapacity": number, "priority": string, "rationale": string}],
  "priorityAreas": [{"area": string, "urgency": string, "impact": string}],
  "capacityAnalysis": {"currentUtilization": number, "projectedDemand": number, "gap": number},
  "roiConsiderations": {"estimatedCost": string, "projectedRevenue": string, "paybackPeriod": string},
  "timeline": {"phases": [{"phase": string, "duration": string, "actions": []}]}
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
    };
  }

  /**
   * Recommend expansion opportunities
   */
  async recommendExpansionOpportunities(schoolId: string): Promise<any> {
    this.logger.log(`Recommending expansion opportunities for school: ${schoolId}`);

    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });

    if (!school) {
      throw new BadRequestException('School not found');
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { schoolId, status: EnrollmentStatus.ACTIVE },
    });

    const leads = await this.leadRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const systemPrompt = 'You are a business development expert. Analyze school data to recommend expansion opportunities. Always respond with valid JSON only.';
    
    const userPrompt = `Recommend expansion opportunities:

School Data:
${JSON.stringify({
  name: school.name,
  address: school.address,
  programsOffered: school.programsOffered,
}, null, 2)}

Current Enrollments: ${enrollments.length}
Recent Leads: ${leads.length}

Provide:
1. Market opportunities
2. Program expansion options
3. Geographic expansion
4. Service expansion
5. Strategic recommendations

Return JSON:
{
  "marketOpportunities": [{"opportunity": string, "marketSize": string, "potential": string}],
  "programExpansion": [{"program": string, "demand": string, "feasibility": string}],
  "geographicExpansion": [{"location": string, "rationale": string, "priority": string}],
  "serviceExpansion": [{"service": string, "description": string, "revenuePotential": string}],
  "strategicRecommendations": [{"recommendation": string, "timeline": string, "impact": string}]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
    };
  }

  /**
   * Generate family profile
   */
  async generateFamilyProfile(leadId: string): Promise<any> {
    this.logger.log(`Generating family profile for lead: ${leadId}`);

    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: ['school'],
    });

    if (!lead) {
      throw new BadRequestException('Lead not found');
    }

    const systemPrompt = 'You are a family engagement specialist. Generate comprehensive family profiles. Always respond with valid JSON only.';
    
    const userPrompt = `Generate family profile:

Lead Data:
${JSON.stringify({
  childName: lead.childName,
  childBirthdate: lead.childBirthdate,
  parentName: lead.parentName,
  parentEmail: lead.parentEmail,
  parentPhone: lead.parentPhone,
  program: lead.program,
  notes: lead.notes,
  leadSource: lead.leadSource,
  leadStatus: lead.leadStatus,
}, null, 2)}

Provide:
1. Family overview
2. Child profile
3. Parent profile
4. Engagement preferences
5. Communication style
6. Recommendations

Return JSON:
{
  "familyOverview": {"summary": string, "keyCharacteristics": []},
  "childProfile": {"age": string, "interests": [], "needs": [], "personality": string},
  "parentProfile": {"engagementLevel": string, "preferences": [], "communicationStyle": string},
  "engagementPreferences": {"preferredChannels": [], "bestTimes": [], "topics": []},
  "communicationStyle": {"tone": string, "frequency": string, "format": string},
  "recommendations": ["personalized recommendations"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
      leadId: lead.id,
    };
  }

  /**
   * Generate response suggestions
   */
  async generateResponseSuggestions(context: string, messageType: string): Promise<any> {
    this.logger.log(`Generating response suggestions for ${messageType}`);

    const systemPrompt = 'You are a communication expert. Generate professional, personalized response suggestions. Always respond with valid JSON only.';
    
    const userPrompt = `Generate response suggestions:

Context:
${context}

Message Type: ${messageType}

Provide:
1. Multiple response options
2. Tone variations
3. Key points to include
4. Personalization tips

Return JSON:
{
  "suggestions": [{"response": string, "tone": string, "useCase": string}],
  "keyPoints": ["points to include"],
  "personalizationTips": ["tips"],
  "bestPractices": ["practices"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
    };
  }

  /**
   * Parent QA Assistant
   */
  async parentQAAssistant(messages: any[], schoolContext: any): Promise<any> {
    this.logger.log('Processing parent QA request');

    const systemPrompt = `You are a friendly and knowledgeable AI assistant for a preschool. You help parents with:
- Enrollment information and process
- School policies and procedures
- Daily schedules and routines
- Tuition and payment information
- Program details and curriculum
- Health and safety protocols
- Parent communication and events
- General preschool questions

Always be helpful, professional, and empathetic. If you don't know something, suggest contacting the school directly. Always respond with valid JSON only.`;
    
    const userPrompt = `Answer the parent's question:

School Context:
${JSON.stringify(schoolContext, null, 2)}

Conversation History:
${JSON.stringify(messages, null, 2)}

Provide:
1. Direct answer
2. Additional helpful information
3. Related topics
4. Next steps if applicable

Return JSON:
{
  "answer": "direct answer to the question",
  "additionalInfo": ["helpful additional information"],
  "relatedTopics": ["related topics they might be interested in"],
  "nextSteps": ["suggested next steps if applicable"],
  "confidence": "high" | "medium" | "low"
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini', 0.7, 2000);

    return {
      success: true,
      response: analysis,
    };
  }

  /**
   * Analyze developmental milestones
   */
  async analyzeDevelopmentalMilestones(studentData: any, progressData: any, enrollmentData: any): Promise<any> {
    this.logger.log('Analyzing developmental milestones');

    const systemPrompt = 'You are an expert early childhood development specialist. Analyze student progress against developmental milestones. Always respond with valid JSON only.';
    
    const userPrompt = `Analyze developmental milestones:

Student Data:
${JSON.stringify(studentData, null, 2)}

Progress Data:
${JSON.stringify(progressData, null, 2)}

Enrollment Data:
${JSON.stringify(enrollmentData, null, 2)}

Provide:
1. Milestone assessment
2. Areas on track
3. Areas needing support
4. Age-appropriateness
5. Recommendations

Return JSON:
{
  "milestoneAssessment": {"overallStatus": string, "ageAppropriate": boolean, "summary": string},
  "areasOnTrack": [{"domain": string, "milestones": [], "status": string}],
  "areasNeedingSupport": [{"domain": string, "milestones": [], "recommendations": []}],
  "ageAppropriateness": {"chronologicalAge": string, "developmentalAge": string, "assessment": string},
  "recommendations": [{"area": string, "activities": [], "timeline": string}]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini', 0.4, 4000);

    return {
      success: true,
      analysis,
    };
  }

  /**
   * Recommend meeting times
   */
  async recommendMeetingTimes(participants: any[], constraints: any): Promise<any> {
    this.logger.log('Recommending meeting times');

    const systemPrompt = 'You are a scheduling expert. Recommend optimal meeting times based on participant availability. Always respond with valid JSON only.';
    
    const userPrompt = `Recommend meeting times:

Participants:
${JSON.stringify(participants, null, 2)}

Constraints:
${JSON.stringify(constraints, null, 2)}

Provide:
1. Recommended time slots
2. Alternative options
3. Participant availability
4. Best fit analysis

Return JSON:
{
  "recommendedSlots": [{"date": string, "time": string, "fitScore": number, "participantsAvailable": []}],
  "alternatives": [{"date": string, "time": string, "fitScore": number}],
  "availabilityAnalysis": {"bestDays": [], "bestTimes": []},
  "recommendations": ["scheduling tips"]
}`;

    const analysis = await this.callOpenAI(systemPrompt, userPrompt);

    return {
      success: true,
      analysis,
    };
  }

  /**
   * Analyze compliance status across all schools (Super Admin)
   */
  async analyzeComplianceStatus(): Promise<any> {
    this.logger.log('Analyzing compliance status across all schools');

    // Fetch all active schools
    const schools = await this.schoolRepository
      .createQueryBuilder('school')
      .where('school.status = :status', { status: 'active' })
      .getMany();

    // Fetch compliance data for each school
    const complianceDataPromises = schools.map(async (school) => {
      // Get staff for this school
      const staffRoles = await this.userRoleRepository.find({
        where: { schoolId: school.id },
        relations: ['profile'],
      });

      // Get staff documents
      const documents = await this.staffDocumentRepository.find({
        where: { schoolId: school.id },
      });

      const totalStaff = staffRoles.length;
      const expiredDocs = documents.filter(
        (d) => d.expiryDate && new Date(d.expiryDate) < new Date(),
      ).length;
      const missingDocs = documents.filter(
        (d) => d.status === StaffDocumentStatus.PENDING,
      ).length;

      const upcomingRenewals = documents.filter((d) => {
        if (!d.expiryDate) return false;
        const expiryDate = new Date(d.expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate > new Date() && expiryDate <= thirtyDaysFromNow;
      }).length;

      // Generate staff compliance details
      const staffDetails = staffRoles.map((staff) => {
        const profile = staff.profile;
        const staffDocs = documents.filter((d) => d.userId === staff.userId);
        const hasExpired = staffDocs.some(
          (d) => d.expiryDate && new Date(d.expiryDate) < new Date(),
        );
        const expiringSoon = staffDocs.some((d) => {
          if (!d.expiryDate) return false;
          const expiryDate = new Date(d.expiryDate);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return expiryDate > new Date() && expiryDate <= thirtyDaysFromNow;
        });

        return {
          name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(),
          role: staff.role,
          certificationStatus: hasExpired
            ? 'expired'
            : expiringSoon
              ? 'expiring_soon'
              : 'valid',
          expiryDate: staffDocs.find((d) => d.expiryDate)?.expiryDate || null,
        };
      });

      return {
        schoolId: school.id,
        schoolName: school.name,
        totalStaff,
        expiredCertifications: expiredDocs,
        missingDocuments: missingDocs,
        upcomingRenewals,
        safetyInspections: {
          lastInspection: null, // Would need additional table for this
          nextDue: null,
          status: 'compliant',
        },
        staffDetails,
      };
    });

    const complianceData = await Promise.all(complianceDataPromises);

    const systemPrompt =
      'You are a compliance expert for childcare facilities. Analyze compliance data across multiple schools and provide actionable insights. Always respond with valid JSON only.';

    const userPrompt = `Analyze compliance status across schools:

Compliance Data:
${JSON.stringify(complianceData, null, 2)}

Current Date: ${new Date().toISOString().split('T')[0]}

Provide comprehensive compliance analysis in JSON format:
{
  "overallCompliance": {
    "status": "compliant" | "needs_attention" | "critical",
    "score": <number 0-100>,
    "summary": "<brief overview>"
  },
  "criticalAlerts": [
    {
      "schoolName": string,
      "severity": "high" | "medium" | "low",
      "issue": string,
      "deadline": string,
      "action": string
    }
  ],
  "upcomingDeadlines": [
    {
      "schoolName": string,
      "type": "certification" | "inspection" | "document",
      "description": string,
      "dueDate": string,
      "daysRemaining": number
    }
  ],
  "complianceBySchool": [
    {
      "schoolName": string,
      "complianceScore": number,
      "status": "compliant" | "needs_attention" | "critical",
      "issues": string[]
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "category": string,
      "recommendation": string,
      "affectedSchools": string[],
      "timeline": string
    }
  ],
  "regulatoryGaps": [
    {
      "regulation": string,
      "description": string,
      "affectedSchools": string[],
      "remediation": string
    }
  ]
}`;

    const analysis = await this.callOpenAI(
      systemPrompt,
      userPrompt,
      'gpt-4o-mini',
      0.4,
      3000,
    );

    return {
      success: true,
      analysis,
      complianceData,
    };
  }

  /**
   * Optimize staff coverage for a school
   */
  async optimizeStaffCoverage(
    schoolId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    this.logger.log(`Optimizing staff coverage for school: ${schoolId}`);

    // Fetch classes with enrollment
    const classes = await this.classRepository.find({
      where: { schoolId },
      relations: ['enrollments'],
    });

    // Fetch staff members
    const staffRoles = await this.userRoleRepository.find({
      where: {
        schoolId,
        role: In([AppRole.TEACHER, AppRole.ADMISSIONS_STAFF]),
      },
      relations: ['profile'],
    });

    // Fetch staff documents for compliance check
    const staffDocuments = await this.staffDocumentRepository.find({
      where: { schoolId },
    });

    // Prepare class data with enrollment counts
    const classData = classes.map((c) => ({
      id: c.id,
      name: c.name,
      program: c.program,
      capacity: c.capacity || 0,
      currentEnrollment: c.enrollments?.length || 0,
      teacherId: c.teacherId,
    }));

    // Prepare staff data
    const staffData = staffRoles.map((staff) => {
      const profile = staff.profile;
      const docs = staffDocuments.filter((d) => d.userId === staff.userId);
      return {
        userId: staff.userId,
        name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(),
        role: staff.role,
        documents: docs.map((d) => ({
          type: d.documentType,
          status: d.status,
          expiryDate: d.expiryDate,
        })),
      };
    });

    const systemPrompt =
      'You are an AI scheduling optimizer specializing in early childhood education staffing. Analyze school data to suggest optimal staff coverage while maintaining required teacher-student ratios. Always respond with valid JSON only.';

    const userPrompt = `Optimize staff coverage:

School ID: ${schoolId}
Date Range: ${startDate || 'today'} to ${endDate || '30 days from now'}

Classes:
${JSON.stringify(classData, null, 2)}

Staff Members:
${JSON.stringify(staffData, null, 2)}

Current Date: ${new Date().toISOString().split('T')[0]}

Standard ratio requirements:
- Infants (0-12 months): 1:4 teacher-to-student ratio
- Toddlers (12-36 months): 1:6 teacher-to-student ratio
- Preschool (3-5 years): 1:10 teacher-to-student ratio

Return JSON:
{
  "overallStaffingHealth": <number 0-100>,
  "totalCoverageGaps": <number>,
  "summary": "<overall summary>",
  "classStaffing": [
    {
      "className": string,
      "program": string,
      "currentEnrollment": number,
      "requiredStaff": number,
      "currentStaff": number,
      "ratioCompliant": boolean,
      "assignedTeachers": string[],
      "staffingLevel": "optimal" | "adequate" | "understaffed" | "critical"
    }
  ],
  "coverageGaps": [
    {
      "date": string,
      "className": string,
      "reason": string,
      "affectedStudents": number,
      "urgency": "critical" | "high" | "medium" | "low",
      "suggestedCoverage": string[]
    }
  ],
  "ratioViolations": [
    {
      "className": string,
      "currentRatio": string,
      "requiredRatio": string,
      "studentCount": number,
      "staffCount": number,
      "severity": "critical" | "high" | "medium",
      "recommendation": string
    }
  ],
  "optimizationSuggestions": [
    {
      "type": string,
      "priority": "critical" | "high" | "medium" | "low",
      "suggestion": string,
      "expectedImpact": string,
      "implementation": string
    }
  ],
  "staffUtilization": {
    "underutilized": string[],
    "overutilized": string[],
    "balanced": string[]
  }
}`;

    const analysis = await this.callOpenAI(
      systemPrompt,
      userPrompt,
      'gpt-4o-mini',
      0.7,
      3000,
    );

    return {
      success: true,
      analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        dataPoints: {
          classes: classData.length,
          staff: staffData.length,
        },
        dateRange: {
          start: startDate || new Date().toISOString().split('T')[0],
          end:
            endDate ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
        },
      },
    };
  }

  /**
   * Check staff compliance for a school
   */
  async checkStaffCompliance(schoolId: string): Promise<any> {
    this.logger.log(`Checking staff compliance for school: ${schoolId}`);

    // Fetch staff members for this school
    const staffRoles = await this.userRoleRepository.find({
      where: {
        schoolId,
        role: In([
          AppRole.TEACHER,
          AppRole.ADMISSIONS_STAFF,
          AppRole.SCHOOL_ADMIN,
        ]),
      },
      relations: ['profile'],
    });

    // Fetch all documents for staff members
    const staffIds = staffRoles.map((s) => s.userId);
    const documents = await this.staffDocumentRepository.find({
      where: {
        schoolId,
        userId: In(staffIds),
      },
    });

    // Prepare data for AI analysis
    const staffData = staffRoles.map((staff) => {
      const profile = staff.profile;
      const staffDocs = documents.filter((d) => d.userId === staff.userId);
      return {
        userId: staff.userId,
        name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(),
        email: profile?.email || '',
        role: staff.role,
        documents: staffDocs.map((d) => ({
          type: d.documentType,
          name: d.documentName,
          issueDate: d.issueDate,
          expiryDate: d.expiryDate,
          status: d.status,
        })),
      };
    });

    const systemPrompt =
      'You are a compliance auditor specializing in childcare facility staff certification requirements. Analyze staff compliance data to identify missing or expiring documents according to typical state requirements. Always respond with valid JSON only.';

    const userPrompt = `Analyze staff compliance:

School ID: ${schoolId}
Current Date: ${new Date().toISOString().split('T')[0]}

Staff Data:
${JSON.stringify(staffData, null, 2)}

Required documents typically include:
- Background checks (annual renewal)
- CPR certification (2-year renewal)
- First Aid certification (2-year renewal)
- TB tests (annual)
- Physical exams (annual)
- Immunization records
- State-specific certifications

Return JSON:
{
  "overallCompliance": "excellent" | "good" | "needs_attention" | "critical",
  "complianceScore": <number 0-100>,
  "totalStaff": <number>,
  "fullyCompliant": <number>,
  "partiallyCompliant": <number>,
  "nonCompliant": <number>,
  "summary": "<brief summary>",
  "staffCompliance": [
    {
      "userId": string,
      "name": string,
      "role": string,
      "complianceStatus": "compliant" | "partial" | "non_compliant",
      "compliancePercentage": <number 0-100>,
      "missingDocuments": string[],
      "expiringDocuments": [
        {
          "documentType": string,
          "documentName": string,
          "expiryDate": string,
          "daysUntilExpiry": number,
          "urgency": "immediate" | "high" | "medium" | "low"
        }
      ],
      "expiredDocuments": string[],
      "actions": string[]
    }
  ],
  "criticalAlerts": [
    {
      "severity": "critical" | "high" | "medium",
      "staffName": string,
      "issue": string,
      "requiredAction": string,
      "deadline": string
    }
  ],
  "expiringDocumentsSummary": {
    "next30Days": <count>,
    "next60Days": <count>,
    "next90Days": <count>
  },
  "requiredDocuments": [
    {
      "documentType": string,
      "description": string,
      "typicalValidity": string,
      "staffMissing": <count>
    }
  ],
  "recommendations": string[],
  "upcomingRenewals": [
    {
      "staffName": string,
      "documentType": string,
      "expiryDate": string,
      "daysUntilExpiry": number
    }
  ]
}`;

    const analysis = await this.callOpenAI(
      systemPrompt,
      userPrompt,
      'gpt-4o-mini',
      0.4,
      3000,
    );

    return {
      success: true,
      analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        totalStaff: staffData.length,
        totalDocuments: documents.length,
      },
    };
  }
}

