# CardConnect Payment Testing Guide

## 🎯 Quick Start

### Working Test Card (Verified ✅)
```
Card Number: 4005550000000019
Expiry: 1225 (December 2025)
CVV: 123
```

## 📋 Complete Working Example

### Create Payment Request (Copy & Paste Ready)

```bash
curl -X POST http://localhost:3001/api/payments/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "cardconnect",
    "amount": 5000,
    "currency": "usd",
    "description": "Monthly tuition payment",
    "metadata": {
      "cardNumber": "4005550000000019",
      "cvv": "123",
      "expiry": "1225",
      "name": "John Doe",
      "address": "123 Test Street",
      "city": "Pittsburgh",
      "region": "PA",
      "postal": "15222",
      "orderId": "ORDER-001"
    }
  }'
```

### Expected Success Response

```json
{
  "success": true,
  "data": {
    "id": "123456789012",
    "provider": "cardconnect",
    "amount": 5000,
    "currency": "usd",
    "status": "succeeded",
    "metadata": {
      "authCode": "123456",
      "respproc": "PPS",
      "retref": "123456789012",
      "orderId": "ORDER-001"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔧 Environment Setup

### Required Environment Variables

```env
# CardConnect Configuration
CARDCONNECT_API_URL=https://fts-uat.cardconnect.com
CARDCONNECT_MERCHANT_ID=800000019079
CARDCONNECT_USERNAME=your_username
CARDCONNECT_PASSWORD=your_password
```

## 🧪 Swagger UI Testing

1. **Navigate to Swagger UI:**
   ```
   http://localhost:3001/api/docs
   ```

2. **Authenticate:**
   - Click "Authorize" 🔓
   - Enter your JWT token
   - Click "Authorize" again

3. **Test Payment Creation:**
   - Find **POST /api/payments/create**
   - Click "Try it out"
   - Select "CardConnect Payment (Verified Working)" from examples dropdown
   - Click "Execute"

## 📊 Raw CardConnect Payload Format

This is the actual payload sent to CardConnect API:

```json
{
  "merchid": "800000019079",
  "account": "4005550000000019",
  "expiry": "1225",
  "cvv2": "123",
  "amount": "50.00",
  "currency": "USD",
  "name": "John Doe",
  "address": "123 Test Street",
  "city": "Pittsburgh",
  "region": "PA",
  "postal": "15222",
  "capture": "Y"
}
```

## 🎴 Additional Test Cards

| Card Number | Result | Use Case |
|------------|--------|----------|
| `4005550000000019` | ✅ Approved | Standard test |
| `4788250000028291` | ✅ Approved | Visa test |
| `5454545454545454` | ✅ Approved | Mastercard |
| `4387751111111053` | ❌ Declined | Test decline |

## 🔄 Complete Test Scenarios

### Scenario 1: Successful Payment
```json
{
  "provider": "cardconnect",
  "amount": 5000,
  "description": "Tuition payment",
  "metadata": {
    "cardNumber": "4005550000000019",
    "cvv": "123",
    "expiry": "1225",
    "name": "John Doe",
    "address": "123 Test Street",
    "city": "Pittsburgh",
    "region": "PA",
    "postal": "15222"
  }
}
```

**Expected:** `status: "succeeded"`, `authCode` in metadata

### Scenario 2: Get Payment Details
```bash
GET /api/payments/cardconnect/{retref}
Authorization: Bearer YOUR_TOKEN
```

### Scenario 3: Create Customer Profile
```json
{
  "provider": "cardconnect",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "metadata": {
    "cardNumber": "4005550000000019",
    "expiry": "1225"
  }
}
```

### Scenario 4: Process Refund
```json
{
  "provider": "cardconnect",
  "paymentId": "123456789012",
  "amount": 2500,
  "reason": "Customer requested refund"
}
```

## 🐛 Troubleshooting

### Common Issues

**401 Unauthorized**
```
✗ Check CARDCONNECT_USERNAME and CARDCONNECT_PASSWORD
✓ Verify Base64 encoding in provider
```

**Merchant ID Error**
```
✗ Verify CARDCONNECT_MERCHANT_ID matches your account
✓ Use: 800000019079 for testing
```

**Declined Payment**
```
✗ Check respstat in response (should be 'A' for approved)
✓ Use verified test card: 4005550000000019
```

**Missing Fields**
```
✗ Ensure all required fields in metadata:
  - cardNumber
  - cvv
  - expiry
  - name (for profiles)
```

## 📝 Response Field Reference

### Success Response Fields

| Field | Description | Example |
|-------|-------------|---------|
| `retref` | Retrieval reference number | "123456789012" |
| `authcode` | Authorization code | "123456" |
| `respproc` | Response processor | "PPS" |
| `respstat` | Response status | "A" (Approved) |
| `resptext` | Response text | "Approval" |
| `amount` | Transaction amount | "50.00" |

### Response Status Codes

| Code | Meaning | Status |
|------|---------|--------|
| `A` | Approved | succeeded |
| `B` | Retry | pending |
| `C` | Declined | failed |

## 🚀 Postman Collection

Import this into Postman:

```json
{
  "info": {
    "name": "CardConnect Payments",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"provider\": \"cardconnect\",\n  \"amount\": 5000,\n  \"metadata\": {\n    \"cardNumber\": \"4005550000000019\",\n    \"cvv\": \"123\",\n    \"expiry\": \"1225\",\n    \"name\": \"John Doe\",\n    \"address\": \"123 Test Street\",\n    \"city\": \"Pittsburgh\",\n    \"region\": \"PA\",\n    \"postal\": \"15222\"\n  }\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{base_url}}/api/payments/create",
          "host": ["{{base_url}}"],
          "path": ["api", "payments", "create"]
        }
      }
    }
  ]
}
```

## 📚 API Documentation

All CardConnect examples are now available in Swagger UI:
- **POST /api/payments/create** - See "CardConnect Payment (Verified Working)" example
- **POST /api/payments/customers** - See "CardConnect Customer Profile" example
- Complete request/response schemas with CardConnect-specific fields

## ✅ Production Checklist

Before going live with CardConnect:

- [ ] Switch to production URL: `https://fts.cardconnect.com`
- [ ] Update to production merchant ID and credentials
- [ ] Never log card numbers or CVV in production
- [ ] Implement PCI DSS compliance measures
- [ ] Use CardSecure tokenization for storing cards
- [ ] Set up webhook endpoint for real-time notifications
- [ ] Test all payment scenarios in production environment
- [ ] Monitor response codes and error rates
- [ ] Set up alerts for failed payments
- [ ] Document incident response procedures

## 🔗 Useful Links

- [CardConnect API Documentation](https://developer.cardpointe.com/cardconnect-api)
- [CardConnect Sandbox Guide](https://developer.cardpointe.com/guides/cardconnect-api)
- [Test Cards Reference](https://developer.cardpointe.com/guides/test-cards)

## 📞 Support

**CardConnect Support:**
- Email: support@cardconnect.com
- Phone: 1-888-477-4500
- Developer Portal: https://developer.cardpointe.com

---

**Last Updated:** 2024-01-15
**Verified Working:** ✅ Test card 4005550000000019



