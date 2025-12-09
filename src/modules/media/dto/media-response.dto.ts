import { ApiProperty } from '@nestjs/swagger';

export class MediaResponseDto {
    @ApiProperty({ description: 'Media record ID' })
    id: string;

    @ApiProperty({ description: 'File URL in S3' })
    fileUrl: string;

    @ApiProperty({ description: 'Original file name' })
    fileName: string;

    @ApiProperty({ description: 'File type (image/video)' })
    fileType: string;

    @ApiProperty({ description: 'School ID' })
    schoolId: string;

    @ApiProperty({ description: 'Child ID', required: false })
    childId?: string;

    @ApiProperty({ description: 'Upload timestamp' })
    createdAt: Date;
}
