import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AppRole } from '../../common/enums/app-role.enum';
import { Student } from '../students/entities/student.entity';
import { ClassEntity, ClassStatus } from '../classes/entities/class.entity';
import { LeadEntity } from '../leads/entities/lead.entity';
import { EnrollmentEntity } from '../enrollment/entities/enrollment.entity';
import { Message } from '../communications/entities/message.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(ClassEntity)
    private readonly classRepository: Repository<ClassEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getStats(user: AuthUser, query: DashboardQueryDto): Promise<DashboardStatsDto> {
    const schoolFilter = this.resolveSchoolFilter(user, query.schoolId);
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalStudents, activeClasses, totalLeads, recentEnrollments, unreadMessages, pendingPayments, monthlyRevenue] =
      await Promise.all([
        this.countStudents(schoolFilter),
        this.countActiveClasses(schoolFilter),
        this.countLeads(schoolFilter),
        this.countRecentEnrollments(schoolFilter, last30Days),
        this.countUnreadMessages(schoolFilter),
        this.countPendingPayments(schoolFilter),
        this.sumMonthlyRevenue(schoolFilter, startOfMonth),
      ]);

    return {
      totalStudents,
      activeClasses,
      totalLeads,
      recentEnrollments,
      unreadMessages,
      pendingPayments,
      monthlyRevenue,
      upcomingEvents: 0,
    };
  }

  private resolveSchoolFilter(user: AuthUser, requested?: string): string | 'all' | undefined {
    if (user.primaryRole === AppRole.SUPER_ADMIN) {
      if (requested === 'all') return 'all';
      return requested || 'all';
    }

    if(!user.schoolId) {
      throw new UnauthorizedException('User does not have a school assigned');
    }

    return user.schoolId;
  }

  private async countStudents(schoolFilter?: string | 'all'): Promise<number> {
    const where = schoolFilter && schoolFilter !== 'all' ? { schoolId: schoolFilter } : {};
    return this.studentRepository.count({ where });
  }

  private async countActiveClasses(schoolFilter?: string | 'all'): Promise<number> {
    const where: Record<string, any> = { status: ClassStatus.OPEN };
    if (schoolFilter && schoolFilter !== 'all') {
      where.schoolId = schoolFilter;
    }
    return this.classRepository.count({ where });
  }

  private async countLeads(schoolFilter?: string | 'all'): Promise<number> {
    const where = schoolFilter && schoolFilter !== 'all' ? { schoolId: schoolFilter } : {};
    return this.leadRepository.count({ where });
  }

  private async countRecentEnrollments(schoolFilter: string | 'all' | undefined, since: Date): Promise<number> {
    const where: Record<string, any> = {
      createdAt: MoreThanOrEqual(since),
    };
    if (schoolFilter && schoolFilter !== 'all') {
      where.schoolId = schoolFilter;
    }

    return this.enrollmentRepository.count({ where });
  }

  private async countUnreadMessages(schoolFilter?: string | 'all'): Promise<number> {
    const where: Record<string, any> = { isRead: false };

    if (schoolFilter && schoolFilter !== 'all') {
      where.schoolId = schoolFilter;
    }

    return this.messageRepository.count({ where });
  }

  private async countPendingPayments(schoolFilter?: string | 'all'): Promise<number> {
    const where: Record<string, any> = { status: PaymentStatus.PENDING };
    if (schoolFilter && schoolFilter !== 'all') {
      where.schoolId = schoolFilter;
    }
    return this.transactionRepository.count({ where });
  }

  private async sumMonthlyRevenue(schoolFilter: string | 'all' | undefined, startOfMonth: Date): Promise<number> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'sum')
      .where('transaction.status = :status', { status: PaymentStatus.PAID })
      .andWhere('transaction.created_at >= :startOfMonth', { startOfMonth });

    if (schoolFilter && schoolFilter !== 'all') {
      queryBuilder.andWhere('transaction.school_id = :schoolId', { schoolId: schoolFilter });
    }

    const result = await queryBuilder.getRawOne<{ sum: string }>();
    return result?.sum ? Number(result.sum) : 0;
  }
}


