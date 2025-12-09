import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media, MediaFileType } from './entities/media.entity';
import { S3Service } from './s3.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { SchoolEntity } from '../schools/entities/school.entity';
import { LeadEntity } from '../leads/entities/lead.entity';

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);

    constructor(
        @InjectRepository(Media)
        private readonly mediaRepository: Repository<Media>,
        @InjectRepository(SchoolEntity)
        private readonly schoolRepository: Repository<SchoolEntity>,
        @InjectRepository(LeadEntity)
        private readonly leadRepository: Repository<LeadEntity>,
        private readonly s3Service: S3Service,
    ) { }

    /**
     * Upload a media file to S3 and save metadata to database
     */
    async uploadMedia(
        file: Express.Multer.File,
        dto: UploadMediaDto,
        uploadedBy: string,
    ): Promise<MediaResponseDto> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // Validate school exists
        const school = await this.schoolRepository.findOne({
            where: { id: dto.schoolId },
        });
        if (!school) {
            throw new NotFoundException(`School with ID ${dto.schoolId} not found`);
        }

        // Validate child exists if childId is provided
        if (dto.childId) {
            const child = await this.leadRepository.findOne({
                where: { id: dto.childId },
            });
            if (!child) {
                throw new NotFoundException(`Child/Lead with ID ${dto.childId} not found`);
            }
        }

        // Validate file type
        const fileType = this.determineFileType(file.mimetype);
        if (!fileType) {
            throw new BadRequestException(
                'Unsupported file type. Please upload an image, video, or document file.',
            );
        }

        // Create folder structure: schoolId/childId (if childId exists)
        const folder = dto.childId
            ? `${dto.schoolId}/${dto.childId}`
            : dto.schoolId;

        // Upload to S3
        const { fileUrl, key } = await this.s3Service.uploadFile(file, folder);

        // Save metadata to database
        const media = this.mediaRepository.create({
            schoolId: dto.schoolId,
            childId: dto.childId || uploadedBy, // Use uploadedBy as fallback if no childId
            uploadedBy,
            fileName: file.originalname,
            fileUrl,
            fileType,
            description: dto.description || null,
            tags: dto.tags || [],
            isFeatured: dto.isFeatured || false,
        });

        const savedMedia = await this.mediaRepository.save(media);

        this.logger.log(`Media uploaded successfully: ${savedMedia.id}`);

        return {
            id: savedMedia.id,
            fileUrl: savedMedia.fileUrl,
            fileName: savedMedia.fileName,
            fileType: savedMedia.fileType,
            schoolId: savedMedia.schoolId,
            childId: savedMedia.childId,
            createdAt: savedMedia.createdAt,
        };
    }

    /**
     * Determine file type from MIME type
     */
    private determineFileType(mimetype: string): MediaFileType | null {
        if (mimetype.startsWith('image/')) {
            return MediaFileType.IMAGE;
        }
        if (mimetype.startsWith('video/')) {
            return MediaFileType.VIDEO;
        }
        // Handle documents (PDF, DOC, DOCX)
        const documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (documentTypes.includes(mimetype)) {
            return MediaFileType.DOCUMENT;
        }
        return null;
    }

    /**
     * Get media by ID
     */
    async getMediaById(id: string): Promise<Media> {
        const media = await this.mediaRepository.findOne({ where: { id } });
        if (!media) {
            throw new BadRequestException('Media not found');
        }
        return media;
    }

    /**
     * Get all media for a school
     */
    async getMediaBySchool(schoolId: string): Promise<Media[]> {
        return this.mediaRepository.find({
            where: { schoolId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Get all media for a child
     */
    async getMediaByChild(childId: string): Promise<Media[]> {
        return this.mediaRepository.find({
            where: { childId },
            order: { createdAt: 'DESC' },
        });
    }
}
