import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CheckInOutService } from './checkinout.service';
import { AuthorizedPickupService } from './authorized-pickup.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { CreateAuthorizedPickupDto } from './dto/create-authorized-pickup.dto';
import { CheckInOutResponseDto } from './dto/check-in-out-response.dto';

@ApiTags('Check-In/Out')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checkinout')
export class CheckInOutController {
  constructor(
    private readonly checkInOutService: CheckInOutService,
    private readonly authorizedPickupService: AuthorizedPickupService,
  ) {}

  @Post('check-in')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Check in a student' })
  @ApiResponse({ status: 201, description: 'Student checked in successfully', type: CheckInOutResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - geofencing failed or already checked in' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  async checkIn(
    @Body() dto: CheckInDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CheckInOutResponseDto> {
    return this.checkInOutService.checkIn(dto, user.id);
  }

  @Post('check-out')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Check out a student' })
  @ApiResponse({ status: 200, description: 'Student checked out successfully', type: CheckInOutResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - geofencing failed or already checked out' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  async checkOut(
    @Body() dto: CheckOutDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CheckInOutResponseDto> {
    return this.checkInOutService.checkOut(dto, user.id);
  }

  @Get('records/:studentId')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Get check-in/out records for a student' })
  @ApiResponse({ status: 200, description: 'Records retrieved successfully', type: [CheckInOutResponseDto] })
  async getRecordsByStudent(
    @Param('studentId') studentId: string,
    @Query('limit') limit: string,
    @CurrentUser() user: AuthUser,
  ): Promise<CheckInOutResponseDto[]> {
    return this.checkInOutService.getRecordsByStudent(
      studentId,
      user.id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('authorized-pickup')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Create an authorized pickup person' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', format: 'uuid' },
        fullName: { type: 'string' },
        relationship: { type: 'string' },
        phone: { type: 'string' },
        photoId: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('photoId'))
  @ApiResponse({ status: 201, description: 'Authorized pickup person created successfully' })
  async createAuthorizedPickup(
    @Body() dto: CreateAuthorizedPickupDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ }),
        ],
      }),
    )
    photoIdFile?: Express.Multer.File,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.authorizedPickupService.createAuthorizedPickup(dto, user!.id, photoIdFile);
  }

  @Get('authorized-pickup/:studentId')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Get authorized pickup persons for a student' })
  @ApiResponse({ status: 200, description: 'Authorized pickup persons retrieved successfully' })
  async getAuthorizedPickupByStudent(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.authorizedPickupService.getAuthorizedPickupByStudent(studentId, user.id);
  }

  @Post('authorized-pickup/:id/revoke')
  @Roles(AppRole.PARENT, AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Revoke an authorized pickup person' })
  @ApiResponse({ status: 200, description: 'Authorized pickup person revoked successfully' })
  async revokeAuthorizedPickup(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const isAdmin = user.primaryRole === AppRole.SCHOOL_ADMIN || user.primaryRole === AppRole.SCHOOL_OWNER;
    await this.authorizedPickupService.revokeAuthorizedPickup(id, user.id, isAdmin);
    return { success: true };
  }

  @Post('authorized-pickup/:id/delete')
  @Roles(AppRole.PARENT)
  @ApiOperation({ summary: 'Delete an authorized pickup person' })
  @ApiResponse({ status: 200, description: 'Authorized pickup person deleted successfully' })
  async deleteAuthorizedPickup(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.authorizedPickupService.deleteAuthorizedPickup(id, user.id);
    return { success: true };
  }
}

