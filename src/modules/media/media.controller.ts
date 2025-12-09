import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    Request,
    BadRequestException,
    ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Media')
@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
            fileFilter: (req, file, callback) => {
                const allowedImage = file.mimetype.startsWith('image/');
                const allowedVideo = file.mimetype.startsWith('video/');
                const allowedDocs = [
                    'application/pdf',
                    'application/msword', // .doc
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                ];

                if (allowedImage || allowedVideo || allowedDocs.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(
                        new BadRequestException(
                            'Invalid file type. Only images, videos, and documents (PDF, DOC, DOCX) are allowed.'
                        ),
                        false,
                    );
                }
            }

        }),
    )
    @ApiOperation({ summary: 'Upload a media file (image or video) to S3' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file', 'schoolId'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Media file (image or video, max 10MB)',
                },
                schoolId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'School ID',
                },
                childId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Child/Student ID (optional)',
                },
                description: {
                    type: 'string',
                    description: 'Media description (optional)',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tags for categorization (optional)',
                },
                isFeatured: {
                    type: 'boolean',
                    description: 'Mark as featured media (optional)',
                    default: false,
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Media uploaded successfully',
        type: MediaResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - invalid file or missing data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT token required' })
    @ApiResponse({ status: 404, description: 'Not found - school or child ID does not exist' })
    @ApiResponse({ status: 413, description: 'File too large (max 10MB)' })
    async uploadMedia(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadMediaDto,
        @Request() req: any,
    ): Promise<MediaResponseDto> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // Use authenticated user ID from JWT token
        const uploadedBy = req.user?.id || req.user?.sub || dto.schoolId;

        return this.mediaService.uploadMedia(file, dto, uploadedBy);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get media by ID' })
    @ApiResponse({ status: 200, description: 'Media found' })
    @ApiResponse({ status: 404, description: 'Media not found' })
    async getMediaById(@Param('id', ParseUUIDPipe) id: string) {
        return this.mediaService.getMediaById(id);
    }

    @Get('school/:schoolId')
    @ApiOperation({ summary: 'Get all media for a school' })
    @ApiResponse({ status: 200, description: 'List of media files' })
    async getMediaBySchool(@Param('schoolId', ParseUUIDPipe) schoolId: string) {
        return this.mediaService.getMediaBySchool(schoolId);
    }

    @Get('child/:childId')
    @ApiOperation({ summary: 'Get all media for a child' })
    @ApiResponse({ status: 200, description: 'List of media files' })
    async getMediaByChild(@Param('childId', ParseUUIDPipe) childId: string) {
        return this.mediaService.getMediaByChild(childId);
    }
}
