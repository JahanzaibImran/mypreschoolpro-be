# Mailer Module - Implementation Guide

## 📋 Overview

The Mailer Module is a comprehensive email service built with NestJS best practices, featuring:

- ✅ **Resend Integration** - Modern email API
- ✅ **Supabase Integration** - Email logging and user preference checking
- ✅ **Caching** - Redis-based caching for email preferences
- ✅ **Role-based Templates** - Welcome emails tailored by user role
- ✅ **Payment Emails** - Invoice, confirmation, reminder, and failure emails
- ✅ **Staff Invitations** - Professional invitation emails
- ✅ **Bulk Email Support** - Rate-limited batch sending
- ✅ **Comprehensive Logging** - All emails logged to database
- ✅ **Swagger Documentation** - Full API documentation

## 🏗️ Architecture

### Module Structure

```
src/modules/mailer/
├── dto/
│   ├── send-email.dto.ts          # Generic email DTO
│   ├── welcome-email.dto.ts       # Welcome email DTO
│   ├── staff-invitation.dto.ts    # Staff invitation DTO
│   └── payment-email.dto.ts       # Payment email DTO
├── interfaces/
│   └── email.interface.ts         # TypeScript interfaces
├── mailer.controller.ts           # REST API endpoints
├── mailer.service.ts              # Core business logic
└── mailer.module.ts               # Module definition
```

## 🚀 Features

### 1. Generic Email Sending

Send any email with HTML content, preference checking, and logging.

**Endpoint:** `POST /api/mailer/send`

**Features:**
- User email preference checking (respects user settings)
- Automatic email logging to database
- Support for CC, BCC, reply-to
- Error handling and retry logic

### 2. Welcome Emails

Role-specific welcome emails for:
- Parents
- School Admins
- Teachers
- School Owners
- Admissions Staff

**Endpoint:** `POST /api/mailer/welcome`

### 3. Staff Invitations

Send professional staff invitation emails with:
- Invitation link
- Role information
- School details
- Expiration notice

**Endpoint:** `POST /api/mailer/staff-invitation`

**Access:** Admin only (super_admin, school_admin, school_owner)

### 4. Payment Emails

Four types of payment emails:
- **Invoice** - New invoice notifications
- **Confirmation** - Payment success confirmations
- **Reminder** - Payment due reminders
- **Failure** - Payment failure notifications

**Endpoint:** `POST /api/mailer/payment`

### 5. Bulk Email Sending

Send emails to multiple recipients with:
- Batch processing (50 emails per batch)
- Rate limiting (1 second between batches)
- Error handling per recipient
- Success/failure tracking

**Endpoint:** `POST /api/mailer/bulk`

**Access:** Admin only

## 🔧 Configuration

### Environment Variables

```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here

# Email Settings
EMAIL_FROM=notifications@mypreschoolpro.com
EMAIL_FROM_NAME=MyPreschoolPro
APP_URL=http://localhost:5173

# Supabase Configuration (for logging)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis Configuration (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Database Tables

The module uses these Supabase tables:

**email_logs:**
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending' | 'sent' | 'failed' | 'skipped'
  user_id UUID,
  school_id UUID,
  metadata JSONB,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Required RPC Function:**
```sql
CREATE OR REPLACE FUNCTION get_user_email_preference(
  user_uuid UUID,
  school_uuid UUID,
  email_type_param TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Your implementation to check user email preferences
  -- Return true to allow, false to block, null for default
  RETURN NULL; -- Default: allow email
END;
$$ LANGUAGE plpgsql;
```

## 📚 API Documentation

### Swagger UI

Visit `http://localhost:3001/api/docs` to view:
- Complete API documentation
- Request/response schemas
- Try-it-out functionality
- Authentication support

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/mailer/send` | Send generic email | ✅ |
| POST | `/api/mailer/welcome` | Send welcome email | ✅ |
| POST | `/api/mailer/staff-invitation` | Send staff invitation | ✅ Admin |
| POST | `/api/mailer/payment` | Send payment email | ✅ |
| POST | `/api/mailer/bulk` | Send bulk emails | ✅ Admin |

## 🎯 Usage Examples

### Send Welcome Email

```typescript
const result = await mailerService.sendWelcomeEmail({
  userEmail: 'parent@example.com',
  userName: 'John Doe',
  userRole: 'parent',
  schoolName: 'Little Stars Preschool',
  schoolId: 'sch_123',
});
```

### Send Payment Invoice

```typescript
const result = await mailerService.sendPaymentEmail({
  type: 'invoice',
  recipientEmail: 'parent@example.com',
  recipientName: 'John Doe',
  schoolName: 'Little Stars Preschool',
  amount: 5000, // $50.00 in cents
  currency: 'usd',
  invoiceNumber: 'INV-2024-001',
  dueDate: '2024-02-01T00:00:00Z',
  paymentUrl: 'https://app.mypreschoolpro.com/payments/pay?id=pay_123',
  schoolId: 'sch_123',
});
```

### Send Staff Invitation

```typescript
const result = await mailerService.sendStaffInvitation({
  schoolId: 'sch_123',
  email: 'teacher@example.com',
  role: 'teacher',
  schoolName: 'Little Stars Preschool',
  invitedBy: 'Jane Smith',
  invitationToken: 'inv_abc123xyz789',
  invitationLink: 'https://app.mypreschoolpro.com/invite/accept?token=inv_abc123xyz789',
});
```

## 🔒 Security Features

1. **JWT Authentication** - All endpoints require authentication
2. **Role-based Access** - Admin endpoints protected
3. **User Preferences** - Respects user email preferences
4. **Rate Limiting** - Bulk email rate limiting
5. **Input Validation** - DTO validation with class-validator
6. **Error Handling** - Comprehensive error handling and logging

## 📊 Monitoring & Logging

### Email Logging

All emails are logged to the `email_logs` table with:
- Recipient email
- Email type
- Subject
- Status (pending/sent/failed/skipped)
- User and school context
- Metadata
- Error messages
- Timestamps

### Cache Strategy

Email preferences are cached for 5 minutes to reduce database queries:
- Cache key: `email_pref:{userId}:{schoolId}:{emailType}`
- TTL: 300 seconds

## 🧪 Testing

### Test Welcome Email

```bash
curl -X POST http://localhost:3001/api/mailer/welcome \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "userName": "Test User",
    "userRole": "parent",
    "schoolName": "Test School"
  }'
```

### Test Payment Email

```bash
curl -X POST http://localhost:3001/api/mailer/payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "invoice",
    "recipientEmail": "test@example.com",
    "recipientName": "Test User",
    "schoolName": "Test School",
    "amount": 5000,
    "currency": "usd",
    "schoolId": "sch_123"
  }'
```

## 🔄 Migration from Supabase Edge Functions

The module replaces these Supabase Edge Functions:

| Edge Function | NestJS Endpoint |
|--------------|----------------|
| `send-email` | `POST /api/mailer/send` |
| `send-welcome-email` | `POST /api/mailer/welcome` |
| `send-staff-invitation` | `POST /api/mailer/staff-invitation` |
| `send-payment-email` | `POST /api/mailer/payment` |
| `send-payment-reminder` | `POST /api/mailer/payment` (type: reminder) |

## 📝 Best Practices Implemented

1. ✅ **Dependency Injection** - Proper NestJS DI
2. ✅ **Service Layer** - Business logic separated from controllers
3. ✅ **DTOs with Validation** - Input validation using class-validator
4. ✅ **Error Handling** - Try-catch with proper error logging
5. ✅ **Logging** - Comprehensive logging at all levels
6. ✅ **Caching** - Redis caching for performance
7. ✅ **Type Safety** - Full TypeScript types
8. ✅ **Swagger Documentation** - Complete API docs
9. ✅ **Rate Limiting** - Bulk email rate limiting
10. ✅ **User Preferences** - Respects user email settings

## 🚨 Error Handling

The service handles:
- Missing API keys gracefully
- Supabase connection errors
- Resend API errors
- User preference check failures
- Invalid email addresses
- Rate limit errors

All errors are logged and returned with appropriate status codes.

## 📈 Performance Optimizations

1. **Caching** - Email preferences cached for 5 minutes
2. **Batch Processing** - Bulk emails sent in batches of 50
3. **Rate Limiting** - 1 second delay between batches
4. **Async Operations** - All database operations are async
5. **Error Isolation** - Failed emails don't block others

## 🎨 Email Templates

All email templates are:
- Responsive HTML
- Mobile-friendly
- Branded with MyPreschoolPro styling
- Accessible
- Professional design

## 🔮 Future Enhancements

Potential improvements:
- [ ] Email template management system
- [ ] A/B testing for emails
- [ ] Email analytics and tracking
- [ ] Scheduled emails
- [ ] Email queue system
- [ ] Multi-language support
- [ ] Email attachments
- [ ] Template variables system

## 📞 Support

For issues or questions:
1. Check Swagger documentation at `/api/docs`
2. Review email logs in `email_logs` table
3. Check application logs for errors
4. Verify environment variables are set correctly

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0






