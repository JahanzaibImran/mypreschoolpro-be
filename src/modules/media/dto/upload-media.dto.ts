import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadMediaDto {
    @ApiProperty({ description: 'School ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    schoolId: string;

    @ApiPropertyOptional({ description: 'Child/Student ID', example: '123e4567-e89b-12d3-a456-426614174001' })
    @IsUUID()
    @IsOptional()
    childId?: string;

    @ApiPropertyOptional({ description: 'Media description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        // Handle JSON string from FormData
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return [];
            }
        }
        return value;
    })
    tags?: string[];

    @ApiPropertyOptional({ description: 'Mark as featured media', default: false })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        // Handle string from FormData
        if (typeof value === 'string') {
            return value === 'true' || value === '1';
        }
        return value;
    })
    isFeatured?: boolean;
}
