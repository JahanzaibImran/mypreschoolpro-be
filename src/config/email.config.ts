import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  resendApiKey: process.env.RESEND_API_KEY,
  // Use verified Resend subdomain: notifications@notifications.mypreschoolpro.com
  // Subdomain notifications.mypreschoolpro.com is verified in Resend (DKIM, SPF, MX all green)
  // API Key: re_LHtzYsTS_LhDv5UP2KkeRZF7ub998qhNB
  // Production: notifications@notifications.mypreschoolpro.com (verified subdomain)
  // Development/Test: onboarding@resend.dev (Resend test domain)
  fromEmail: process.env.EMAIL_FROM || 'notifications@notifications.mypreschoolpro.com',
  fromName: process.env.EMAIL_FROM_NAME || 'MyPreschoolPro',
}));