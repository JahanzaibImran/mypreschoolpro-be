import { PaymentReminderData } from '../interfaces/email.interface';

export function getPaymentReminderTemplate(data: PaymentReminderData): string {
  const formattedAmount = (data.amount / 100).toFixed(2);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .amount-box { background: white; border: 2px solid #F59E0B; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: bold; color: #F59E0B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 Payment Reminder</h1>
    </div>
    <div class="content">
      <p>Dear ${data.parentName},</p>
      
      <p>This is a friendly reminder that a payment for <strong>${data.childName}</strong>'s tuition is due soon.</p>
      
      <div class="amount-box">
        <div>Amount Due</div>
        <div class="amount">$${formattedAmount}</div>
        <div style="color: #666; margin-top: 10px;">Due Date: ${data.dueDate}</div>
      </div>
      
      <center>
        <a href="${data.invoiceUrl}" class="button">View Invoice & Pay Now</a>
      </center>
      
      <p>You can pay securely through your parent portal using:</p>
      <ul>
        <li>Credit or Debit Card</li>
        <li>ACH Bank Transfer</li>
        <li>Payment Plan (if available)</li>
      </ul>
      
      <p>If you've already made this payment, please disregard this reminder.</p>
      
      <p>Thank you for your prompt attention!</p>
      
      <p>Best regards,<br>
      Your School Administration</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MyPreschoolPro. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}