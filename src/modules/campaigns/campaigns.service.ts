import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignStatus } from '../../common/enums/campaign-status.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AppRole } from '../../common/enums/app-role.enum';

interface FindCampaignsOptions {
  schoolId?: string;
  schoolIds?: string[];
  status?: CampaignStatus;
  limit?: number;
  offset?: number;
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
  ) {}

  async create(createCampaignDto: CreateCampaignDto, userId: string): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      createdBy: userId,
      status: createCampaignDto.status || CampaignStatus.DRAFT,
      scheduledAt: createCampaignDto.scheduledAt ? new Date(createCampaignDto.scheduledAt) : null,
    });

    return this.campaignRepository.save(campaign);
  }

  async findAll(
    options: FindCampaignsOptions,
    user?: AuthUser,
  ): Promise<{ data: Campaign[]; total: number }> {
    const queryBuilder = this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.school', 'school');

    // Filter by school IDs
    if (options.schoolIds && options.schoolIds.length > 0) {
      queryBuilder.andWhere('campaign.school_id IN (:...schoolIds)', { schoolIds: options.schoolIds });
    } else if (options.schoolId) {
      queryBuilder.andWhere('campaign.school_id = :schoolId', { schoolId: options.schoolId });
    }

    // Filter by status
    if (options.status) {
      queryBuilder.andWhere('campaign.status = :status', { status: options.status });
    }

    // Order by created date (newest first)
    queryBuilder.orderBy('campaign.createdAt', 'DESC');

    // Pagination
    if (options.limit !== undefined) {
      queryBuilder.take(options.limit);
    }
    if (options.offset !== undefined) {
      queryBuilder.skip(options.offset);
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['school'],
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID "${id}" not found`);
    }

    return campaign;
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.findOne(id);

    Object.assign(campaign, {
      ...updateCampaignDto,
      scheduledAt: updateCampaignDto.scheduledAt ? new Date(updateCampaignDto.scheduledAt) : campaign.scheduledAt,
    });

    return this.campaignRepository.save(campaign);
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.findOne(id);
    await this.campaignRepository.remove(campaign);
  }

  async ensureUserCanManageCampaign(campaign: Campaign, user: AuthUser): Promise<void> {
    if (user.primaryRole === AppRole.SUPER_ADMIN) {
      return;
    }

    if (user.primaryRole === AppRole.SCHOOL_OWNER) {
      // School owners can manage campaigns for schools they own
      // Load school if not already loaded
      if (!campaign.school) {
        const campaignWithSchool = await this.campaignRepository.findOne({
          where: { id: campaign.id },
          relations: ['school'],
        });
        if (!campaignWithSchool) {
          throw new NotFoundException(`Campaign with ID "${campaign.id}" not found`);
        }
        campaign.school = campaignWithSchool.school;
      }
      
      // Check if user owns the school
      const accessibleSchoolIds = new Set<string>();
      if (user.schoolId) {
        accessibleSchoolIds.add(user.schoolId);
      }
      user.roles?.forEach(role => {
        if (role.schoolId) {
          accessibleSchoolIds.add(role.schoolId);
        }
      });

      // Check if school owner matches or if school is in accessible schools
      if (campaign.school.ownerId !== user.id && !accessibleSchoolIds.has(campaign.schoolId)) {
        throw new ForbiddenException('You can only manage campaigns for schools you own');
      }
      return;
    }

    // School admins and admissions staff can manage campaigns for their assigned school
    if (user.schoolId !== campaign.schoolId) {
      throw new ForbiddenException('You can only manage campaigns for your assigned school');
    }
  }
}

