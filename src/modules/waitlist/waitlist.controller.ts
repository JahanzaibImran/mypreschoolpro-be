import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { WaitlistQueryDto } from './dto/waitlist-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { WaitlistResponseDto } from './dto/waitlist-response.dto';
import { UpdateWaitlistStatusDto } from './dto/update-waitlist-status.dto';
import { UpdateWaitlistPositionDto } from './dto/update-waitlist-position.dto';
import { UpdateWaitlistEntryDto } from './dto/update-waitlist-entry.dto';
import { ParentWaitlistEntryDto } from './dto/parent-waitlist-entry.dto';

@ApiTags('Waitlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get('count')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get waitlist count',
    description: 'Get the total count of waitlist entries, optionally filtered by status.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by waitlist status (e.g., new)',
    example: 'new',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
    description: 'Filter by school ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 25 },
      },
    },
  })
  async getWaitlistCount(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('schoolId') schoolId?: string,
  ): Promise<{ count: number }> {
    const count = await this.waitlistService.countWaitlist(status, schoolId, user);
    return { count };
  }

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({
    summary: 'Get waitlist data with aggregated stats',
    description: 'Returns waitlist entries, school summaries, and high-level statistics.',
  })
  async getWaitlist(
    @CurrentUser() user: AuthUser,
    @Query() query: WaitlistQueryDto,
  ): Promise<WaitlistResponseDto> {
    return this.waitlistService.getWaitlist(user, query);
  }

  @Get('parent')
  @Roles(AppRole.PARENT)
  @ApiOperation({
    summary: 'Get waitlist entries for the authenticated parent',
    description: 'Returns waitlist applications for the current parent user, including calculated positions and metadata.',
  })
  @ApiResponse({
    status: 200,
    description: 'Parent waitlist entries retrieved successfully',
    type: [ParentWaitlistEntryDto],
  })
  async getParentWaitlist(
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: true; data: ParentWaitlistEntryDto[] }> {
    const entries = await this.waitlistService.getParentWaitlist(user);
    return {
      success: true,
      data: entries,
    };
  }

  @Put(':id/status')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Update waitlist status',
    description: 'Updates the waitlist entry status and associated lead status.',
  })
  async updateStatus(
    @Param('id') waitlistId: string,
    @Body() payload: UpdateWaitlistStatusDto,
  ): Promise<{ success: true }> {
    await this.waitlistService.updateStatus(waitlistId, payload);
    return { success: true };
  }

  @Put(':id/position')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Update waitlist position',
    description: 'Moves a waitlist entry up or down in the queue.',
  })
  async updatePosition(
    @Param('id') waitlistId: string,
    @Body() payload: UpdateWaitlistPositionDto,
  ): Promise<{ success: true }> {
    await this.waitlistService.updatePosition(waitlistId, payload);
    return { success: true };
  }

  @Put(':id/enroll')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Enroll waitlisted lead',
    description: 'Marks a waitlisted lead as enrolled/declined and triggers downstream workflows.',
  })
  async enrollLead(@Param('id') waitlistId: string): Promise<{ success: true }> {
    await this.waitlistService.enrollLead(waitlistId);
    return { success: true };
  }

  @Put(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF)
  @ApiOperation({
    summary: 'Update waitlist entry',
    description: 'Update waitlist entry details (notes, priority score).',
  })
  @ApiParam({
    name: 'id',
    description: 'Waitlist entry ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist entry updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async updateEntry(
    @Param('id') waitlistId: string,
    @Body() payload: UpdateWaitlistEntryDto,
  ): Promise<{ success: true }> {
    await this.waitlistService.updateEntry(waitlistId, payload);
    return { success: true };
  }
}





