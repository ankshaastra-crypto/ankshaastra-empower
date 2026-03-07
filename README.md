# Ankshaastra Payment System

Production-ready payment processing system with PhonePe integration and email notifications. Optimized for serverless deployment on Vercel

## Features

- PhonePe Payment Integration
- Email Notifications (Customer & Admin)
- PostgreSQL Database (orders, customer_details, payment)
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

**Optional (required for /admin/orders):**

```bash
# PostgreSQL - stores orders, customer details, and payments
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

REDIS_URL=redis://localhost:6379
NODE_ENV=development

# Package Pricing (Frontend - Optional)
# These are optional. If not set, defaults will be used:
# - Name Check: ₹199 (hardcoded in OrderFormSection.tsx)
# - Single Report: ₹1997 (fallback in packagePricing.ts)
# IMPORTANT: After changing these values, restart the dev server (Ctrl+C then npm run dev)
VITE_PACKAGE_NAMECHECK_PRICE=199
VITE_PACKAGE_NAMECHECK_ORIGINAL_PRICE=199
VITE_PACKAGE_SINGLE_PRICE=1997
VITE_PACKAGE_SINGLE_ORIGINAL_PRICE=5100
```

**Note:** Vite environment variables are loaded at build/dev server startup. After changing these values:

- **Development:** Restart the dev server (`Ctrl+C` then `npm run dev`)
- **Production:** Rebuild and redeploy (`npm run build`)

Generate encryption key:

```bash
openssl rand -hex 32
```

### Database Setup (PostgreSQL / Supabase)

**For Supabase + Vercel (recommended):**

1. Create a project at [supabase.com](https://supabase.com) → **New Project**.
2. In Supabase: **Project Settings** → **Database** → copy the **Connection string** (URI).
3. In Vercel: **Settings** → **Environment Variables** → add:
   - `DATABASE_URL` = your Supabase connection string (encode `@` in password as `%40`)
   - `INIT_DB_SECRET` = a random string (e.g. `openssl rand -hex 16`)
4. **Deploy** your app to Vercel.
5. **Create tables** (one-time): open in browser:
   ```
   https://your-app.vercel.app/api/admin/init-db?secret=YOUR_INIT_DB_SECRET
   ```
   You should see: `{"success":true,"message":"Tables created successfully..."}`

**Alternative (manual schema):** Run `psql $DATABASE_URL -f database/schema.sql` locally.

**Tables:** `orders`, `customer_details`, `payment`

## Development

```bash
npm run dev              # Start frontend only (Vite)
vercel dev               # Full stack: frontend + API (requires Vercel CLI)
npm run build            # Build for production
```

**Note:** For `/admin/orders` and payment APIs to work locally, use `vercel dev` (or deploy to Vercel).

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
│   ├── db.js                    # PostgreSQL connection & queries
│   ├── encryption.js            # Data encryption
│   ├── initiate-payment.js      # Payment initiation
│   ├── payment-status.js        # Payment status check
│   ├── payment-webhook.js       # PhonePe webhook
│   ├── rate-limiter.js          # Rate limiting
│   ├── redis-cache.js           # Redis cache
│   └── send-email.js            # Email sending
├── database/
│   └── schema.sql               # PostgreSQL schema (orders, customer_details, payment)
├── public/
│   └── templates/
│       └── invoice.html         # Invoice HTML template (client-side PDF generation)
└── src/                         # React frontend
```

## Troubleshooting

### Database Connection Failed / Tables Not Created / Payments Not Stored

- **Tables not created:** After deploying, call `https://your-app.vercel.app/api/admin/init-db?secret=YOUR_INIT_DB_SECRET` once. Set `INIT_DB_SECRET` in Vercel env vars.
- **Payments not stored:** Ensure tables exist (run init-db above) and `DATABASE_URL` is set in Vercel.
- Check `DATABASE_URL` format: `postgresql://user:password@host:5432/dbname` (Supabase: add `?sslmode=require` if missing; encode `@` in password as `%40`).
- For Supabase: Use the **Connection string (URI)** from Project Settings → Database.
- App continues without DB; orders/payments won't be persisted if DB fails.

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
- [ ] PostgreSQL database created (Supabase/Neon)
- [ ] `DATABASE_URL` set in Vercel
- [ ] `INIT_DB_SECRET` set, then called `/api/admin/init-db?secret=...` to create tables
- [ ] Redis URL set (if using Redis)
- [ ] `.env` not committed to git
- [ ] Rate limits tested
- [ ] Error handling tested

## License

Private - All rights reserved

---

**Ankshaastra** - Payment System

Last Updated: January 2025
