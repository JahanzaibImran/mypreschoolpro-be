import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AuthService } from '../auth.service';
import { AuthUser } from '../interfaces/auth-user.interface';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      jsonWebTokenOptions: {
        algorithms: ['HS256'],
      },
    });

    this.logger.debug(`🔑 JWT Strategy initialized`);
    this.logger.debug(`🔑 JWT Secret configured: ${jwtSecret ? 'YES' : 'NO'}`);
    if (jwtSecret) {
      this.logger.debug(`🔑 JWT Secret length: ${jwtSecret.length} characters`);
    }
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const startTime = Date.now();
    this.logger.debug(`🔍 JWT Strategy validate() called`);
    this.logger.debug(`📦 JWT Payload: ${JSON.stringify({
      sub: payload.sub,
      email: payload.email,
      aud: payload.aud,
      exp: payload.exp,
    })}`);

    if (!payload.sub) {
      this.logger.error(`❌ No 'sub' field in JWT payload`);
      throw new UnauthorizedException('Invalid token payload');
    }

    const cacheKey = `auth:user:${payload.sub}`;
    const cachedUser = await this.cacheManager.get<AuthUser>(cacheKey);

    if (cachedUser) {
      const elapsed = Date.now() - startTime;
      this.logger.debug(`⚡ Cache HIT for user ${payload.sub} (${elapsed}ms)`);
      return cachedUser;
    }

    this.logger.debug(`💾 Cache MISS for user ${payload.sub}, building context...`);

    const authUser = await this.authService.buildAuthUser(payload.sub, payload.email);

    this.logger.debug(`📋 User roles: ${authUser.roles.map((r) => r.role).join(', ')}`);
    this.logger.debug(`👤 Primary role: ${authUser.primaryRole} | School: ${authUser.schoolId ?? 'none'}`);

    await this.cacheManager.set(cacheKey, authUser, 600000);

    const elapsed = Date.now() - startTime;
    this.logger.debug(`✅ Validation successful - User: ${payload.sub} (${elapsed}ms)`);

    return authUser;
  }
}