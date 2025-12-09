import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
    Logger,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { Reflector } from '@nestjs/core';
  import { Observable } from 'rxjs';
  
  @Injectable()
  export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(private reflector: Reflector) {
      super();
    }
  
    canActivate(
      context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
      const request = context.switchToHttp().getRequest();
      
      this.logger.debug(`🔐 JWT Guard activated for: ${request.method} ${request.url}`);
      
      // Log authorization header
      const authHeader = request.headers.authorization;
      if (authHeader) {
        this.logger.debug(`📝 Authorization header present: ${authHeader.substring(0, 20)}...`);
      } else {
        this.logger.warn(`⚠️ No authorization header found`);
      }

      // Check if route is marked as public
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
  
      if (isPublic) {
        this.logger.debug(`🔓 Route is public, skipping authentication`);
        return true;
      }
  
      this.logger.debug(`🔒 Route is protected, validating token...`);
      return super.canActivate(context);
    }
  
    handleRequest(err, user, info) {
      this.logger.debug(`📋 HandleRequest called`);
      
      if (info) {
        this.logger.warn(`⚠️ Passport info: ${JSON.stringify(info)}`);
      }

      if (err) {
        this.logger.error(`❌ Error in authentication: ${err.message}`);
        this.logger.error(`Error stack: ${err.stack}`);
        throw err;
      }

      if (!user) {
        this.logger.error(`❌ No user returned from JWT strategy`);
        this.logger.error(`Info object: ${JSON.stringify(info)}`);
        throw new UnauthorizedException('Authentication required');
      }

      this.logger.debug(`✅ User authenticated successfully: ${user.id} (${user.email})`);
      return user;
    }
  }