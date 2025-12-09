import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
    private readonly logger = new Logger(S3Service.name);
    private readonly s3Client: S3Client;
    private readonly bucket: string;
    private readonly region: string;

    constructor(private readonly configService: ConfigService) {
        const accessKeyId = this.configService.get<string>('s3.accessKeyId');
        const secretAccessKey = this.configService.get<string>('s3.secretAccessKey');
        this.region = this.configService.get<string>('s3.region') || 'us-east-1';
        this.bucket = this.configService.get<string>('s3.bucket') || '';

        if (!accessKeyId || !secretAccessKey || !this.bucket) {
            this.logger.warn('S3 not fully configured. Please set AWS credentials and bucket name.');
            throw new BadRequestException('S3 storage is not configured');
        }

        this.s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        this.logger.log(`S3 client initialized for bucket: ${this.bucket} in region: ${this.region}`);
    }

    /**
     * Upload a file to S3
     * @param file - The file buffer and metadata
     * @param folder - Optional folder path in S3 (e.g., 'schoolId/childId')
     * @returns The S3 URL of the uploaded file
     */
    async uploadFile(
        file: Express.Multer.File,
        folder?: string,
    ): Promise<{ fileUrl: string; key: string }> {
        try {
            const fileExt = file.originalname.split('.').pop();
            const timestamp = Date.now();
            const uniqueId = randomUUID();
            const fileName = `${timestamp}_${uniqueId}.${fileExt}`;

            // Construct the S3 key (path)
            const key = folder ? `${folder}/${fileName}` : fileName;

            // Upload to S3
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    // Make the file publicly readable (optional, adjust based on your needs)
                    // ACL: 'public-read',
                }),
            );

            // Construct the file URL
            const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

            this.logger.log(`File uploaded successfully: ${key}`);

            return { fileUrl, key };
        } catch (error) {
            this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to upload file to S3');
        }
    }

    /**
     * Delete a file from S3
     * @param fileUrl - The S3 URL of the file to delete
     */
    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // Extract key from URL
            // URL format: https://bucket.s3.region.amazonaws.com/key
            const urlParts = fileUrl.split('.amazonaws.com/');
            if (urlParts.length !== 2) {
                throw new BadRequestException('Invalid S3 file URL');
            }
            const key = urlParts[1];

            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );

            this.logger.log(`File deleted successfully: ${key}`);
        } catch (error) {
            this.logger.error(`Failed to delete file from S3: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to delete file from S3');
        }
    }

    /**
     * Get a signed URL for downloading a file from S3
     * @param fileUrl - The S3 URL of the file
     * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
     * @returns Signed URL that can be used to download the file
     */
    async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
        try {
            // Extract key from URL
            // URL format: https://bucket.s3.region.amazonaws.com/key
            const urlParts = fileUrl.split('.amazonaws.com/');
            if (urlParts.length !== 2) {
                throw new BadRequestException('Invalid S3 file URL');
            }
            const key = urlParts[1];

            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
            return signedUrl;
        } catch (error) {
            this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to generate signed URL');
        }
    }

    /**
     * Check if S3 is properly configured
     */
    isConfigured(): boolean {
        return !!this.bucket && !!this.region;
    }
}
