import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  /**
   * Keep the global prefix free of the version segment because
   * we already enable URI versioning (which will prepend `/v1`).
   * Using `api` here means our routes resolve to `/api/v1/...`.
   */
  apiPrefix: process.env.API_PREFIX || 'api',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
  ],
}));
