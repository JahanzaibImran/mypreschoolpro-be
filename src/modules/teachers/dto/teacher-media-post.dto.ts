import { ApiProperty } from '@nestjs/swagger';
import { MediaResponseDto } from '../../media/dto/media-response.dto';

export class TaggedStudentDto {
  @ApiProperty({ description: 'Student/Lead ID' })
  id: string;

  @ApiProperty({ description: 'Child name' })
  childName: string;

  @ApiProperty({ description: 'Parent name' })
  parentName: string;

  @ApiProperty({ description: 'Parent email' })
  parentEmail: string;
}

export class MediaFileDto {
  @ApiProperty({ description: 'Media record ID' })
  id: string;

  @ApiProperty({ description: 'Child ID' })
  childId: string;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'File URL' })
  fileUrl: string;

  @ApiProperty({ description: 'File type (image/video)' })
  fileType: string;

  @ApiProperty({ description: 'Description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Tags', type: [String], nullable: true })
  tags: string[] | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Tagged student information' })
  student: TaggedStudentDto;
}

export class TeacherMediaPostDto {
  @ApiProperty({ description: 'Post ID (caption or generated ID)' })
  id: string;

  @ApiProperty({ description: 'Array of media files in this post', type: [MediaFileDto] })
  files: MediaFileDto[];

  @ApiProperty({ description: 'Post caption/description' })
  caption: string;

  @ApiProperty({ description: 'Tagged students', type: [TaggedStudentDto] })
  taggedStudents: TaggedStudentDto[];

  @ApiProperty({ description: 'Date created' })
  dateCreated: string;

  @ApiProperty({ description: 'Whether post is private' })
  isPrivate: boolean;

  @ApiProperty({ description: 'Number of likes', required: false })
  likes?: number;

  @ApiProperty({ description: 'Comments', type: [Object], required: false })
  comments?: any[];
}









