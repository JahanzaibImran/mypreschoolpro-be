/**
 * Email type enum for categorizing emails
 * This enum must match the database email_type enum in Supabase
 */
export enum EmailType {
  WELCOME = 'welcome',
  PAYMENT_INVOICE = 'payment_invoice',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_FAILURE = 'payment_failure',
  ACTIVITY_NOTIFICATION = 'activity_notification',
  LEAD_NOTIFICATION = 'lead_notification',
  SYSTEM_ALERT = 'system_alert',
  DOCUMENT_REMINDER = 'document_reminder',
  INVOICE_REMINDER = 'invoice_reminder',
  STAFF_INVITATION = 'staff_invitation',
}



