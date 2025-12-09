import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ParentRegistrationService } from './parent-registration.service';
import { PublicSchoolDto } from './dto/public-school.dto';
import { CheckAvailabilityQueryDto, AvailabilityResponseDto } from './dto/check-availability.dto';
import { WaitlistPaymentSessionDto, WaitlistPaymentResponseDto } from './dto/waitlist-payment.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@ApiTags('Parent Registration')
@Controller('parent/registration')
export class ParentRegistrationController {
  constructor(private readonly parentRegistrationService: ParentRegistrationService) {}

  @Public()
  @Get('schools')
  @ApiOperation({ summary: 'List active schools for public registration' })
  async getPublicSchools(): Promise<PublicSchoolDto[]> {
    return this.parentRegistrationService.getPublicSchools();
  }

  @Public()
  @Get('schools/:schoolId/availability')
  @ApiOperation({ summary: 'Check program availability for a school' })
  async checkAvailability(
    @Param('schoolId') schoolId: string,
    @Query() query: CheckAvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    return this.parentRegistrationService.checkAvailability(schoolId, query.program);
  }

  @Public()
  @Post('waitlist')
  @ApiOperation({ summary: 'Create a waitlist entry for a lead' })
  async createWaitlistEntry(@Body() body: CreateWaitlistEntryDto) {
    return this.parentRegistrationService.createWaitlistEntry(body);
  }

  @Public()
  @Post('payment-session')
  @ApiOperation({ summary: 'Create a checkout session for waitlist payments' })
  async createPaymentSession(
    @Body() body: WaitlistPaymentSessionDto,
  ): Promise<WaitlistPaymentResponseDto> {
    return this.parentRegistrationService.createWaitlistPaymentSession(body);
  }

  @Public()
  @Post('documents/public')
  @ApiOperation({ summary: 'Upload enrollment-related documents (public - no auth required)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        leadId: { type: 'string', format: 'uuid', description: 'Lead ID' },
        schoolId: { type: 'string', format: 'uuid', description: 'School ID' },
        documentType: {
          type: 'string',
          description: 'Document type (e.g., enrollment_packet, shot_records, physical_records)',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (max 10MB)',
        },
      },
      required: ['leadId', 'schoolId', 'documentType', 'file'],
    },
  })
  async uploadPublicDocument(
    @Body() body: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.parentRegistrationService.uploadPublicDocument(body, file);
  }

  @Post('documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload enrollment-related documents (authenticated)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        leadId: { type: 'string', format: 'uuid' },
        schoolId: { type: 'string', format: 'uuid' },
        documentType: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['leadId', 'schoolId', 'documentType', 'file'],
    },
  })
  async uploadDocument(
    @Body() body: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: AuthUser },
  ) {
    return this.parentRegistrationService.uploadDocument(body, file, req.user);
  }
}


