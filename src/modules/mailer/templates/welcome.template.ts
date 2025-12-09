import { WelcomeEmailData } from '../interfaces/email.interface';

export function getWelcomeEmailTemplate(data: WelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to MyPreschoolPro!</h1>
    </div>
    <div class="content">
      <p>Dear ${data.parentName || data.userName},</p>
      
      ${data.childName ? `
      <p>We're thrilled to have <strong>${data.childName}</strong> join the ${data.schoolName || 'our school'} family!</p>
      ` : `
      <p>Welcome to ${data.schoolName || 'MyPreschoolPro'}!</p>
      `}
      
      <p>Your parent portal is now ready. Here you can:</p>
      <ul>
        <li>Track your child's progress and milestones</li>
        <li>View daily activity reports and photos</li>
        <li>Communicate with teachers</li>
        <li>Manage payments and invoices</li>
        <li>Stay updated with school announcements</li>
      </ul>
      
      <center>
        <a href="${data.loginUrl || '#'}" class="button">Access Your Parent Portal</a>
      </center>
      
      <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
      
      <p>Best regards,<br>
      The ${data.schoolName || 'MyPreschoolPro'} Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MyPreschoolPro. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}