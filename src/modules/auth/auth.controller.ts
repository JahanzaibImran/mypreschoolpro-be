import {
  Controller,
  Get,
  UseGuards,
  Logger,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from './interfaces/auth-user.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * GET /api/auth/me
   * Returns current user data with roles
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user',
    description: 'Returns the authenticated user\'s complete profile including roles and permissions',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'john.doe@example.com' },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  role: { type: 'string', example: 'teacher' },
                  schoolId: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                },
              },
            },
            primaryRole: { type: 'string', example: 'teacher' },
            schoolId: { type: 'string', nullable: true },
            profile: {
              type: 'object',
              nullable: true,
              properties: {
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                phone: { type: 'string', example: '+1234567890' },
                status: { type: 'string', example: 'active' },
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid or expired token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid or expired token' },
      },
    },
  })
  async getCurrentUser(@CurrentUser() user: AuthUser) {
    this.logger.log(`User ${user.id} fetching their data`);
    
    const userData = await this.authService.getUserData(user.id);
    
    return {
      success: true,
      data: userData,
    };
  }

  /**
   * GET /api/auth/roles
   * Returns current user roles
   */
  @Get('roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user roles',
    description: 'Returns the authenticated user\'s roles, primary role, and associated school',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User roles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  role: { type: 'string', example: 'teacher' },
                  schoolId: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                },
              },
            },
            primaryRole: { 
              type: 'string', 
              example: 'teacher',
              enum: ['super_admin', 'school_owner', 'school_admin', 'admissions_staff', 'teacher', 'parent'],
            },
            schoolId: { 
              type: 'string', 
              nullable: true,
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid or expired token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid or expired token' },
      },
    },
  })
  async getUserRoles(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      data: {
        roles: user.roles,
        primaryRole: user.primaryRole,
        schoolId: user.schoolId,
      },
    };
  }

  /**
   * GET /api/auth/profile
   * Returns current user profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user profile',
    description: 'Returns the authenticated user\'s detailed profile information',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            firstName: { type: 'string', example: 'John', nullable: true },
            lastName: { type: 'string', example: 'Doe', nullable: true },
            email: { type: 'string', example: 'john.doe@example.com', nullable: true },
            phone: { type: 'string', example: '+1234567890', nullable: true },
            schoolId: { type: 'string', nullable: true },
            status: { type: 'string', example: 'active' },
            createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
            updatedAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid or expired token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid or expired token' },
      },
    },
  })
  async getUserProfile(@CurrentUser() user: AuthUser) {
    const profile = await this.authService.getUserProfile(user.id);
    
    return {
      success: true,
      data: profile,
    };
  }

  /**
   * GET /api/auth/impersonation/check
   * Check if current user is being impersonated
   */
  @Get('impersonation/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Check impersonation status',
    description: 'Returns whether the authenticated user is currently being impersonated',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Impersonation status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            isImpersonating: { type: 'boolean', example: true },
            superAdminId: { type: 'string', nullable: true, example: '123e4567-e89b-12d3-a456-426614174000' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid or expired token',
  })
  async checkImpersonation(@CurrentUser() user: AuthUser) {
    const result = await this.authService.checkActiveImpersonation(user.id);
    
    return {
      success: true,
      data: result,
    };
  }

  /**
   * PATCH /api/auth/update-email
   * Update user email address
   */
  @Patch('update-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update user email',
    description: 'Update the authenticated user\'s email address. Requires email verification.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email', example: 'newemail@example.com' },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email update initiated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email update initiated. Please check your new email for verification.' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async updateEmail(
    @CurrentUser() user: AuthUser,
    @Body() body: { email: string },
  ) {
    await this.authService.updateEmail(user.id, body.email);
    return {
      success: true,
      message: 'Email update initiated. Please check your new email for verification.',
    };
  }

  /**
   * PATCH /api/auth/update-password
   * Update user password
   */
  @Patch('update-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update user password',
    description: 'Update the authenticated user\'s password. Requires current password verification.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', example: 'currentPassword123' },
        newPassword: { type: 'string', example: 'newPassword123', minLength: 8 },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password updated successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async updatePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.authService.updatePassword(user.id, body.currentPassword, body.newPassword);
    return {
      success: true,
      message: 'Password updated successfully',
    };
  }
}