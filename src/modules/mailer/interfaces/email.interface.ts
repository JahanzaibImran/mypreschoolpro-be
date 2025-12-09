export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  emailType?: string;
  userId?: string;
  schoolId?: string;
  metadata?: Record<string, any>;
}

export interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  userRole: string;
  schoolName?: string;
  schoolId?: string;
  // Legacy properties for old template compatibility
  parentName?: string;
  childName?: string;
  loginUrl?: string;
}

export interface StaffInvitationData {
  schoolId: string;
  email: string;
  role: string;
  schoolName: string;
  invitedBy: string;
  invitationToken: string;
  invitationLink: string;
  // Legacy properties for old template compatibility
  recipientName?: string;
  inviteLink?: string;
  expiresIn?: string;
}

export interface PaymentEmailData {
  type: 'invoice' | 'confirmation' | 'reminder' | 'failure';
  recipientEmail: string;
  recipientName: string;
  schoolName: string;
  amount: number;
  currency?: string;
  invoiceNumber?: string;
  dueDate?: string;
  paymentDate?: string;
  paymentUrl?: string;
  userId?: string;
  schoolId: string;
  metadata?: Record<string, any>;
}

// Legacy interfaces for backward compatibility with old template files
export interface PaymentReminderData {
  parentName: string;
  childName: string;
  amount: number;
  dueDate: string;
  invoiceUrl: string;
}

export interface PaymentConfirmationData {
  parentName: string;
  childName: string;
  amount: number;
  paymentDate: string;
  receiptUrl: string;
}

export interface EmailLogData {
  recipient_email: string;
  email_type: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  user_id?: string;
  school_id?: string;
  metadata?: Record<string, any>;
  error_message?: string;
  sent_at?: string;
}