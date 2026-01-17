# Ankshaastra Payment System

Production-ready payment processing system with PhonePe integration and email notifications. Optimized for serverless deployment on Vercel.

## Features

- PhonePe Payment Integration
- Email Notifications (Customer & Admin)
- Redis Caching & Rate Limiting
- Production-Ready & Serverless-Friendly

## Quick Start

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Environment Variables

**Required:**

```bash
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_SECURE=false

ADMIN_EMAIL=admin@ankshaastra.com
FROM_EMAIL=Ankshaastra <noreply@ankshaastra.com>

ENCRYPTION_KEY=your_32_character_key
```

**Optional:**

```bash
REDIS_URL=redis://localhost:6379
NODE_ENV=development

# Package Pricing (Frontend)
# IMPORTANT: After changing these values, restart the dev server (Ctrl+C then npm run dev)
VITE_PACKAGE_NAMECHECK_PRICE=199
VITE_PACKAGE_NAMECHECK_ORIGINAL_PRICE=199
VITE_PACKAGE_SINGLE_PRICE=1997
VITE_PACKAGE_SINGLE_ORIGINAL_PRICE=5100
VITE_PACKAGE_FAMILY_PRICE=3994
VITE_PACKAGE_FAMILY_ORIGINAL_PRICE=10200
```

**Note:** Vite environment variables are loaded at build/dev server startup. After changing these values:

- **Development:** Restart the dev server (`Ctrl+C` then `npm run dev`)
- **Production:** Rebuild and redeploy (`npm run build`)

Generate encryption key:

```bash
openssl rand -hex 32
```

## Development

```bash
npm run dev              # Start development server (deprecation warnings suppressed)
npm run build            # Build for production
```

**Note:** The `DEP0169` deprecation warning about `url.parse()` comes from dependencies (nodemailer, ioredis, etc.) and is automatically suppressed. This is safe as it's not from our code.

## Removed Dependencies

The following dependencies have been removed as they were only used for invoice generation:

- `bullmq` - Queue system (was used for invoice queue)
- `puppeteer` & `puppeteer-cluster` - PDF generation (was used for invoice PDFs)
- `@sparticuz/chromium` - Serverless Chromium (was used for invoice PDFs)
- `ejs` - Template engine (was used for invoice templates)
- `@tanstack/react-query` - Data fetching (not used in the app)
- `recharts` - Chart library (not used in the app)

## Production Deployment

### Vercel (Recommended)

1. **Set Up Upstash Redis:**

   - Create account at [console.upstash.com](https://console.upstash.com/)
   - Create database → Copy Redis URL

2. **Configure Vercel:**

   ```bash
   npm i -g vercel
   vercel link
   ```

   - Add all environment variables in Vercel Dashboard
   - Set `REDIS_URL` to Upstash Redis URL (if using Redis)
   - **Optional:** Set `NODE_OPTIONS=--no-deprecation` to suppress DEP0169 warnings from dependencies

3. **Create `vercel.json`:**

   ```json
   {
     "functions": {
       "api/**/*.js": {
         "maxDuration": 60
       }
     }
   }
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

### Traditional Server

```bash
npm run build
npm start
```

## Production Features

### Redis Caching

- Falls back to in-memory if Redis unavailable

### Rate Limiting

- `/api/initiate-payment`: 10 requests/15 min
- `/api/payment-status`: 30 requests/min
- `/api/payment-webhook`: 100 requests/min

## API Endpoints

### POST `/api/initiate-payment`

Initiates payment with PhonePe.

**Request:**

```json
{
  "amount": 1997,
  "mobile": "9876543210",
  "email": "customer@example.com",
  "name": "Customer Name",
  "dob": "01-01-1990",
  "orderId": "ORD1234567890-abc123",
  "packageType": "single"
}
```

### GET `/api/payment-status`

Checks payment status after PhonePe redirect.

**Response:**

```json
{
  "success": true,
  "status": "SUCCESS",
  "orderId": "ORD1234567890-abc123",
  "transactionId": "TXN1234567890",
  "amount": 1997
}
```

### POST `/api/payment-webhook`

PhonePe webhook endpoint.

## Project Structure

```
├── api/
│   ├── encryption.js            # Data encryption
│   ├── initiate-payment.js     # Payment initiation
│   ├── payment-status.js        # Payment status check
│   ├── payment-webhook.js       # PhonePe webhook
│   ├── rate-limiter.js          # Rate limiting
│   ├── redis-cache.js           # Redis cache
│   └── send-email.js            # Email sending
├── templates/
│   ├── invoice.ejs              # Template file (kept for reference)
│   └── invoice-data.json        # Data file (kept for reference)
└── src/                         # React frontend
```

## Troubleshooting

### Redis Connection Failed

- Check `REDIS_URL` is correct
- Verify Redis server is running
- Falls back to in-memory cache

### Email Not Sending

- Verify SMTP credentials
- For Gmail: Use App Password (not regular password)
- Check firewall allows SMTP connections

### Function Timeout (Vercel)

- Upgrade to Pro plan (60s limit)

## Security

- Input validation
- Host header validation
- Sensitive data encryption
- No sensitive data in logs
- Rate limiting
- Environment variable security

## Production Checklist

- [ ] All environment variables set
- [ ] PhonePe credentials configured
- [ ] SMTP credentials configured
- [ ] Encryption key generated (32+ chars)
- [ ] Redis URL set (if using Redis)
- [ ] `.env` not committed to git
- [ ] Rate limits tested
- [ ] Error handling tested

## License

Private - All rights reserved

---

**Ankshaastra** - Payment System

Last Updated: January 2025
