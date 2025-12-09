import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  resendApiKey: process.env.RESEND_API_KEY,
  // Use verified Resend test domain by default, or custom verified domain via env
  // Verified domains: onboarding@resend.dev, notifications@resend.dev
  // Production: notifications@mypreschoolpro.com (must be verified in Resend)
  fromEmail: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  fromName: process.env.EMAIL_FROM_NAME || 'MyPreschoolPro',
}));