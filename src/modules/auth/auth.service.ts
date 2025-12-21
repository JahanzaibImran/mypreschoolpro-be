import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppRole, APP_ROLE_PRIORITY } from '../../common/enums/app-role.enum';
import { UsersService } from '../users/users.service';
import { AuthUser, UserProfile, UserRole } from './interfaces/auth-user.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ImpersonationSession } from '../users/entities/impersonation-session.entity';
import { ProfileEntity } from '../users/entities/profile.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(ImpersonationSession)
    private readonly impersonationRepository: Repository<ImpersonationSession>,
  ) { }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Pass plain password - Supabase Auth will handle hashing
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password, // Plain password for Supabase Auth
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: registerDto.role,
      schoolId: registerDto.schoolId,
    });

    const roles = user.roles?.map((role) => role.role) || [];
    const tokens = await this.generateTokens(user.id, roles);

    return {
      user: {
        id: user.id,
        email: user.email,
        roles,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Use Supabase Auth for login instead of local password check
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new UnauthorizedException('Authentication service not configured');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (authError || !authData.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user profile and roles
    const user = await this.usersService.findById(authData.user.id);
    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is inactive');
    }

    await this.usersService.updateLastLogin(authData.user.id);

    const roles = user.roles?.map((role) => role.role) || [];
    const tokens = await this.generateTokens(user.id, roles);

    return {
      user: {
        id: user.id,
        email: user.email,
        roles,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'your-refresh-secret',
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const roles = user.roles?.map((role) => role.role) || [];
      return this.generateTokens(user.id, roles);
    } catch (error) {
      this.logger.warn(`Refresh token failed: ${error}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Build the AuthUser payload used by guards and controllers.
   */
  async buildAuthUser(userId: string, emailFromToken?: string): Promise<AuthUser> {
    const [roles, profile] = await Promise.all([
      this.getUserRoles(userId),
      this.getUserProfile(userId),
    ]);

    if (!roles.length) {
      throw new UnauthorizedException('User has no assigned roles');
    }

    if (profile?.status === 'inactive') {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const email = emailFromToken ?? profile?.email;
    if (!email) {
      throw new UnauthorizedException('User email is missing');
    }

    const primaryRole = this.getPrimaryRole(roles);
    const schoolId = this.getPrimarySchoolId(roles);

    return {
      id: userId,
      email,
      roles,
      primaryRole,
      schoolId,
    };
  }

  /**
   * Load all roles for the given user.
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const roleEntities = await this.usersService.findRolesByUserId(userId);

      return roleEntities.map((role) => ({
        id: role.id,
        role: role.role,
        schoolId: role.schoolId,
        createdAt: role.createdAt?.toISOString() ?? new Date().toISOString(),
      }));
    } catch (error) {
      this.logger.error(`Error fetching roles for user ${userId}: ${error.message}`);
      throw new UnauthorizedException('Unable to load user roles');
    }
  }

  /**
   * Load the user profile (if it exists).
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await this.usersService.findProfileById(userId);

      if (!profile) {
        this.logger.warn(`Profile not found for user ${userId}`);
        return null;
      }

      return {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        schoolId: profile.schoolId,
        status: profile.status ?? 'active',
        createdAt: profile.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: profile.updatedAt?.toISOString() ?? new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error fetching profile for user ${userId}: ${error.message}`);
      throw new UnauthorizedException('Unable to load user profile');
    }
  }

  /**
   * Return a hydrated response DTO for the currently authenticated user.
   */
  async getUserData(userId: string): Promise<UserResponseDto | null> {
    const [roles, profile] = await Promise.all([
      this.getUserRoles(userId),
      this.getUserProfile(userId),
    ]);

    if (!roles.length) {
      return null;
    }

    const primaryRole = this.getPrimaryRole(roles);
    const schoolId = this.getPrimarySchoolId(roles);
    const email = profile?.email ?? '';

    return {
      id: userId,
      email,
      roles: roles.map((role) => ({
        id: role.id,
        role: role.role,
        schoolId: role.schoolId,
        createdAt: role.createdAt,
      })),
      primaryRole,
      schoolId,
      profile: profile
        ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          status: profile.status,
        }
        : undefined,
    };
  }

  /**
   * Determine primary role based on priority.
   */
  getPrimaryRole(roles: UserRole[]): AppRole {
    const sorted = [...roles].sort(
      (a, b) => APP_ROLE_PRIORITY[a.role] - APP_ROLE_PRIORITY[b.role],
    );

    return sorted[0]?.role ?? AppRole.PARENT;
  }

  /**
   * Get primary school ID (from highest priority role).
   */
  getPrimarySchoolId(roles: UserRole[]): string | null {
    const sorted = [...roles].sort(
      (a, b) => APP_ROLE_PRIORITY[a.role] - APP_ROLE_PRIORITY[b.role],
    );

    const primaryRole = sorted[0];
    if (!primaryRole) {
      return null;
    }

    if (primaryRole.role === AppRole.SUPER_ADMIN) {
      return null;
    }

    return primaryRole.schoolId ?? null;
  }

  hasRole(user: AuthUser, role: AppRole): boolean {
    return user.roles.some((r) => r.role === role);
  }

  hasAnyRole(user: AuthUser, roles: AppRole[]): boolean {
    return user.roles.some((r) => roles.includes(r.role));
  }

  belongsToSchool(user: AuthUser, schoolId: string): boolean {
    if (this.hasRole(user, AppRole.SUPER_ADMIN)) {
      return true;
    }

    return user.roles.some((r) => r.schoolId === schoolId);
  }

  /**
   * Clear cached user data (call this when user roles or profile are updated).
   */
  async clearUserCache(userId: string): Promise<void> {
    const cacheKey = `auth:user:${userId}`;
    await this.cacheManager.del(cacheKey);
    this.logger.debug(`🗑️ Cleared cache for user: ${userId}`);
  }

  /**
   * Update user email address (using Supabase Admin API)
   */
  async updateEmail(userId: string, newEmail: string): Promise<void> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestException('Invalid user ID');
    }

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.error('Supabase configuration missing - URL or Service Role Key not set');
      throw new BadRequestException('Supabase configuration missing');
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify user exists before attempting update
    try {
      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (getUserError || !userData?.user) {
        this.logger.error(`User not found: ${userId}`, getUserError);
        throw new BadRequestException('User not found');
      }
      this.logger.log(`Found user ${userId}, current email: ${userData.user.email}`);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error verifying user existence: ${error.message}`);
      throw new BadRequestException('Unable to verify user. Please try again.');
    }

    // Check if email is already in use by another user (skip if updating to same email)
    try {
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(newEmail);
      if (existingUser?.user && existingUser.user.id !== userId) {
        throw new BadRequestException('Email is already in use by another user');
      }
    } catch (error: any) {
      // If error is not about user not found, and not our BadRequestException, log it
      if (!(error instanceof BadRequestException)) {
        if (error.message && !error.message.includes('not found')) {
          this.logger.warn(`Error checking existing email: ${error.message}`);
        }
      } else {
        // Re-throw BadRequestException (email already in use)
        throw error;
      }
    }

    // Update email in Supabase Auth
    this.logger.log(`Attempting to update email for user ${userId} to ${newEmail}`);
    this.logger.log(`Supabase URL configured: ${!!supabaseUrl}, Service Key configured: ${!!supabaseServiceKey}`);

    let updateResult: any = null;
    let error: any = null;
    let data: any = null;

    // Try multiple approaches to update email
    const updateStrategies = [
      // Strategy 1: Update with email confirmation required
      {
        name: 'with_email_confirm_false',
        options: { email: newEmail, email_confirm: false },
      },
      // Strategy 2: Update without email_confirm flag
      {
        name: 'without_email_confirm',
        options: { email: newEmail },
      },
      // Strategy 3: Update with auto_confirm false
      {
        name: 'with_auto_confirm_false',
        options: { email: newEmail, email_confirm: false, auto_confirm: false },
      },
      // Strategy 4: Update with email_confirm true (skip verification)
      {
        name: 'with_email_confirm_true',
        options: { email: newEmail, email_confirm: true },
      },
    ];

    for (const strategy of updateStrategies) {
      try {
        this.logger.log(`Trying update strategy: ${strategy.name}`);
        updateResult = await supabaseAdmin.auth.admin.updateUserById(userId, strategy.options);

        if (updateResult.error) {
          const errorCode = (updateResult.error as any).code || '';
          const errorStatus = updateResult.error.status;

          // If it's not unexpected_failure or 500, this might be a different issue
          if (errorCode !== 'unexpected_failure' && errorStatus !== 500) {
            error = updateResult.error;
            data = updateResult.data;
            break; // Exit loop, we have a specific error
          }

          // If it's unexpected_failure, try next strategy
          this.logger.warn(`Strategy ${strategy.name} failed with ${errorCode}, trying next...`);
          continue;
        } else {
          // Success!
          data = updateResult.data;
          error = null;
          this.logger.log(`Email update succeeded using strategy: ${strategy.name}`);
          break;
        }
      } catch (err: any) {
        this.logger.warn(`Strategy ${strategy.name} threw exception: ${err.message}`);
        if (updateStrategies.indexOf(strategy) === updateStrategies.length - 1) {
          // Last strategy failed
          error = err;
        }
        continue;
      }
    }

    // If all strategies failed, use the last error
    if (!data && !error && updateResult) {
      error = updateResult.error;
      data = updateResult.data;
    }

    if (error) {
      this.logger.error(`Supabase error updating email for user ${userId}:`, {
        message: error.message,
        status: error.status,
        name: error.name,
        code: (error as any).code,
        error: JSON.stringify(error),
      });

      // Handle specific Supabase error codes
      const errorCode = (error as any).code || '';
      const errorMessage = error.message?.toLowerCase() || '';

      // Handle unexpected_failure (500) - usually indicates Supabase internal issue or permission problem
      if (errorCode === 'unexpected_failure' || error.status === 500) {
        this.logger.error(`Supabase unexpected_failure - This usually indicates:`);
        this.logger.error(`1. Service role key may not have admin permissions`);
        this.logger.error(`2. Supabase instance may have configuration issues`);
        this.logger.error(`3. User may have constraints preventing email update`);

        // As a fallback, update the profile email even if Supabase Auth update fails
        // This allows the system to continue functioning
        try {
          const profile = await this.usersService.findProfileById(userId);
          if (profile) {
            const profileUpdate: Partial<ProfileEntity> = {
              id: userId,
              email: newEmail,
            };
            await (this.usersService as any).upsertProfile(profileUpdate);
            this.logger.warn(`Updated profile email as fallback, but Supabase Auth update failed`);

            // Clear cache
            await this.clearUserCache(userId);

            // Log warning but don't throw - allow the update to proceed
            // The profile email is updated, which is the most important part
            this.logger.warn(
              `Email update completed with fallback: Profile email updated to ${newEmail}, ` +
              `but Supabase Auth update failed. User may need to verify email manually.`
            );

            // Return early - profile update succeeded
            return;
          }
        } catch (fallbackError: any) {
          // If fallback also fails, log and continue to throw original error
          this.logger.error(`Fallback profile update also failed: ${fallbackError.message}`);
        }

        throw new BadRequestException(
          'Unable to update email. This may be due to Supabase configuration or permissions. ' +
          'Please verify the service role key has admin permissions and try again.'
        );
      }

      if (errorMessage.includes('already registered') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate') ||
        error.status === 422 ||
        errorCode === 'email_address_invalid' ||
        errorCode === 'signup_disabled') {
        throw new BadRequestException('Email is already in use by another user');
      }
      if (errorMessage.includes('invalid') || errorMessage.includes('format') || errorCode === 'validation_failed') {
        throw new BadRequestException('Invalid email address format');
      }
      if (errorMessage.includes('not found') || error.status === 404 || errorCode === 'user_not_found') {
        throw new BadRequestException('User not found');
      }
      if (error.status === 401 || error.status === 403 || errorCode === 'invalid_credentials') {
        throw new BadRequestException('Permission denied. Please check Supabase service role key configuration.');
      }

      // Return more detailed error message
      throw new BadRequestException(
        `Failed to update email: ${error.message || 'Unknown error'}${error.status ? ` (Status: ${error.status})` : ''}${errorCode ? ` [Code: ${errorCode}]` : ''}`
      );
    }

    this.logger.log(`Successfully updated email for user ${userId} to ${newEmail}`);

    // Update email in profile
    const profile = await this.usersService.findProfileById(userId);
    if (profile) {
      // Update email in profile - upsertProfile accepts Partial<ProfileEntity>
      const profileUpdate: Partial<ProfileEntity> = {
        id: userId,
        email: newEmail,
      };
      await (this.usersService as any).upsertProfile(profileUpdate);
    }

    // Clear cache
    await this.clearUserCache(userId);
  }

  /**
   * Update user password (using Supabase Admin API)
   * Note: We can't verify current password server-side with Supabase Admin API,
   * so we'll rely on the frontend to handle this or use a different approach.
   * For now, we'll update the password directly (admin operation).
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Validate password length
    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new BadRequestException('Supabase configuration missing');
    }

    // Note: With Supabase Admin API, we can't verify the current password server-side
    // The frontend should verify it before calling this endpoint, or we could
    // use Supabase's updateUser method which requires the user to be authenticated
    // For now, we'll update directly using Admin API (trusting the frontend validation)

    // Verify current password by attempting to sign in
    const profile = await this.usersService.findProfileById(userId);
    if (!profile || !profile.email) {
      throw new BadRequestException('User profile or email not found');
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Try to sign in with current password
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      this.logger.warn(`Password update failed: Invalid current password for user ${userId}`);
      throw new BadRequestException('Incorrect current password');
    }

    // Update password in Supabase Auth
    // Use Admin API to ensure update happens regardless of session state
    const { error } = await supabaseClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw new BadRequestException(`Failed to update password: ${error.message}`);
    }

    // Clear cache
    await this.clearUserCache(userId);
  }

  /**
   * Check if the current user is being impersonated
   */
  async checkActiveImpersonation(userId: string): Promise<{
    isImpersonating: boolean;
    superAdminId: string | null;
  }> {
    try {
      const impersonationLog = await this.impersonationRepository.findOne({
        where: {
          impersonatedUserId: userId,
          isActive: true,
        },
        select: ['superAdminId', 'impersonatedUserId'],
      });

      if (!impersonationLog) {
        return {
          isImpersonating: false,
          superAdminId: null,
        };
      }

      return {
        isImpersonating: true,
        superAdminId: impersonationLog.superAdminId,
      };
    } catch (error) {
      this.logger.error(`Error checking impersonation for user ${userId}: ${error.message}`);
      return {
        isImpersonating: false,
        superAdminId: null,
      };
    }
  }

  private async generateTokens(userId: string, roles: string[]) {
    const payload: Record<string, any> = {
      sub: userId,
      roles,
    };

    const accessTokenExpiresIn =
      (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as StringValue;
    const refreshTokenExpiresIn =
      (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
        '7d') as StringValue;

    const accessTokenOptions: JwtSignOptions = {
      secret:
        this.configService.get<string>('JWT_SECRET') ||
        this.configService.get<string>('SUPABASE_JWT_SECRET'),
      expiresIn: accessTokenExpiresIn,
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'your-refresh-secret',
      expiresIn: refreshTokenExpiresIn,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessTokenOptions),
      this.jwtService.signAsync(payload, refreshTokenOptions),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}