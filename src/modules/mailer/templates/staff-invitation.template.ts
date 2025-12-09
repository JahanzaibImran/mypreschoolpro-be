import { StaffInvitationData } from '../interfaces/email.interface';

export function getStaffInvitationTemplate(data: StaffInvitationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .badge { display: inline-block; background: #EEF2FF; color: #4F46E5; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600; }
    .warning { background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F59E0B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👋 You're Invited!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.recipientName || 'there'},</p>
      
      <p><strong>${data.schoolName}</strong> has invited you to join their team as a <span class="badge">${data.role}</span>.</p>
      
      <p>MyPreschoolPro helps you manage daily operations, track student progress, communicate with parents, and much more.</p>
      
      <center>
        <a href="${data.inviteLink || data.invitationLink}" class="button">Accept Invitation</a>
      </center>
      
      ${data.expiresIn ? `
      <div class="warning">
        ⏰ <strong>Important:</strong> This invitation expires in ${data.expiresIn}. Please accept it before then.
      </div>
      ` : ''}
      
      <p>If you have any questions, please contact ${data.schoolName} directly.</p>
      
      <p>Welcome aboard!<br>
      The MyPreschoolPro Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MyPreschoolPro. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}