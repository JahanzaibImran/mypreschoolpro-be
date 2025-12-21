import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    Request,
    BadRequestException,
    Param,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import type { UploadDocumentDto, ChildDocumentSummary } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { ProgressResponseDto } from './dto/progress-response.dto';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.TEACHER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all students for the current user\'s school' })
    @ApiResponse({ status: 200, description: 'List of students' })
    async getAllStudents(@CurrentUser() user: AuthUser) {
        return this.studentsService.getAllStudents(user);
    }

    @Get('documents/parent')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all documents for authenticated parent\'s children' })
    @ApiResponse({
        status: 200,
        description: 'List of children with their documents',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT token required' })
    async getParentDocuments(@Request() req: any): Promise<ChildDocumentSummary[]> {
        const userEmail = req.user?.email;
        if (!userEmail) {
            throw new BadRequestException('User email not found in token');
        }

        return this.studentsService.getDocumentsByParentEmail(userEmail);
    }

    @Post('documents/upload')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
            fileFilter: (req, file, callback) => {
                const allowedImage = file.mimetype.startsWith('image/');
                const allowedDocs = [
                    'application/pdf',
                    'application/msword', // .doc
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                ];

                if (allowedImage || allowedDocs.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(
                        new BadRequestException(
                            'Invalid file type. Only images and documents (PDF, DOC, DOCX) are allowed.',
                        ),
                        false,
                    );
                }
            },
        }),
    )
    @ApiOperation({ summary: 'Upload a student document' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file', 'studentId', 'schoolId', 'documentType'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Document file (image or PDF/DOC/DOCX, max 10MB)',
                },
                studentId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Student/Child ID',
                },
                schoolId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'School ID',
                },
                documentType: {
                    type: 'string',
                    description: 'Type of document (e.g., enrollment_packet, shot_records, physical_records)',
                },
                expiryDate: {
                    type: 'string',
                    format: 'date',
                    description: 'Document expiry date (optional)',
                },
                notes: {
                    type: 'string',
                    description: 'Additional notes (optional)',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Document uploaded successfully',
    })
    @ApiResponse({ status: 400, description: 'Bad request - invalid file or missing data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT token required' })
    @ApiResponse({ status: 404, description: 'Not found - student or school ID does not exist' })
    @ApiResponse({ status: 413, description: 'File too large (max 10MB)' })
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadDocumentDto,
        @Request() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // Use authenticated user ID from JWT token
        const uploadedBy = req.user?.id || req.user?.sub;

        return this.studentsService.uploadDocument(file, dto, uploadedBy);
    }

    @Get('documents/by-student-ids')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get student documents by student IDs' })
    @ApiQuery({
        name: 'schoolId',
        required: true,
        type: String,
        description: 'School ID',
    })
    @ApiQuery({
        name: 'studentIds',
        required: true,
        type: String,
        description: 'Comma-separated list of student/lead IDs',
    })
    @ApiQuery({
        name: 'statuses',
        required: false,
        type: String,
        description: 'Comma-separated list of statuses to filter by (e.g., approved,pending)',
    })
    @ApiResponse({
        status: 200,
        description: 'List of student documents',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    student_id: { type: 'string' },
                    document_type: { type: 'string' },
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getDocumentsByStudentIds(
        @Query('schoolId') schoolId: string,
        @Query('studentIds') studentIds: string,
        @Query('statuses') statuses?: string,
    ): Promise<Array<{ student_id: string; document_type: string }>> {
        const studentIdsArray = studentIds
            .split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0);

        const statusesArray = statuses
            ? statuses.split(',').map(s => s.trim() as any).filter(s => s.length > 0)
            : undefined;

        return this.studentsService.getDocumentsByStudentIds(schoolId, studentIdsArray, statusesArray);
    }

    @Get('documents')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.TEACHER, AppRole.PARENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get student documents by student ID and school ID' })
    @ApiQuery({
        name: 'studentId',
        required: true,
        type: String,
        description: 'Student/Lead ID',
    })
    @ApiQuery({
        name: 'schoolId',
        required: true,
        type: String,
        description: 'School ID',
    })
    @ApiResponse({
        status: 200,
        description: 'List of student documents',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    studentId: { type: 'string' },
                    schoolId: { type: 'string' },
                    documentType: { type: 'string' },
                    category: { type: 'string' },
                    fileName: { type: 'string' },
                    filePath: { type: 'string' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    uploadedBy: { type: 'string' },
                    uploadDate: { type: 'string' },
                    expiryDate: { type: 'string', nullable: true },
                    status: { type: 'string' },
                    notes: { type: 'string', nullable: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getDocuments(
        @Query('studentId') studentId: string,
        @Query('schoolId') schoolId: string,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.studentsService.getDocuments(studentId, schoolId, user);
    }

    @Patch('documents/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update student document status' })
    @ApiParam({
        name: 'id',
        description: 'Document ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['pending', 'verified', 'expired'],
                    description: 'New document status',
                },
                notes: {
                    type: 'string',
                    description: 'Optional notes',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Document updated successfully',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    async updateDocument(
        @Param('id') documentId: string,
        @Body() body: { status?: string; notes?: string },
        @CurrentUser() user: AuthUser,
    ) {
        return this.studentsService.updateDocument(documentId, body.status, body.notes, user);
    }

    @Delete('documents/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a student document' })
    @ApiParam({
        name: 'id',
        description: 'Document ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: 200,
        description: 'Document deleted successfully',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    async deleteDocument(
        @Param('id') documentId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.studentsService.deleteDocument(documentId, user);
    }

    @Get('documents/:id/download-url')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.SUPER_ADMIN, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.TEACHER, AppRole.PARENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get signed URL for downloading a document' })
    @ApiParam({
        name: 'id',
        description: 'Document ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: 200,
        description: 'Signed URL generated successfully',
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'Signed URL for downloading the document' },
                expiresIn: { type: 'number', description: 'URL expiration time in seconds' },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    async getDocumentDownloadUrl(
        @Param('id') documentId: string,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.studentsService.getDocumentDownloadUrl(documentId, user);
    }

    @Post('attendance')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upsert attendance record (create or update)' })
    @ApiResponse({
        status: 201,
        description: 'Attendance recorded successfully',
        type: AttendanceResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - No access to this student' })
    async upsertAttendance(
        @Body() dto: UpsertAttendanceDto,
        @CurrentUser() user: AuthUser,
    ): Promise<AttendanceResponseDto> {
        return this.studentsService.upsertAttendance(dto, user.id);
    }

    @Get(':studentId/attendance')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.PARENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get attendance records for a student' })
    @ApiParam({
        name: 'studentId',
        description: 'Student ID (actually lead_id from enrollment)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Maximum number of records to return',
        example: 30,
    })
    @ApiResponse({
        status: 200,
        description: 'Attendance records retrieved successfully',
        type: [AttendanceResponseDto],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - No access to this student' })
    async getStudentAttendance(
        @Param('studentId') studentId: string,
        @Query('limit') limit?: number,
        @CurrentUser() user?: AuthUser,
    ): Promise<AttendanceResponseDto[]> {
        const userRoles = user?.roles?.map((r) => r.role) || [];
        return this.studentsService.getStudentAttendance(
            studentId,
            user!.id,
            userRoles,
            user!.email,
            limit ? Number(limit) : undefined,
        );
    }

    @Post('progress')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upsert progress record (create or update)' })
    @ApiResponse({
        status: 201,
        description: 'Progress recorded successfully',
        type: ProgressResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - No access to this student' })
    async upsertProgress(
        @Body() dto: UpsertProgressDto,
        @CurrentUser() user: AuthUser,
    ): Promise<ProgressResponseDto> {
        return this.studentsService.upsertProgress(dto, user.id);
    }

    @Get(':studentId/progress')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.TEACHER, AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.PARENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get progress records for a student' })
    @ApiParam({
        name: 'studentId',
        description: 'Student ID (actually lead_id from enrollment)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: 200,
        description: 'Progress records retrieved successfully',
        type: [ProgressResponseDto],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - No access to this student' })
    async getStudentProgress(
        @Param('studentId') studentId: string,
        @CurrentUser() user?: AuthUser,
    ): Promise<ProgressResponseDto[]> {
        const userRoles = user?.roles?.map((r) => r.role) || [];
        return this.studentsService.getStudentProgress(
            studentId,
            user!.id,
            userRoles,
            user!.email,
        );
    }
}
