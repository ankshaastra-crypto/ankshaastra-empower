# Ankshaastra Payment System

Production-ready payment processing system with Razorpay integration and email notifications. Optimized for serverless deployment on Vercel

## Features

- Razorpay Payment Integration
- Email Notifications (Customer & Admin)
- PostgreSQL Database (`ankshaastra` schema: orders, customer_details, payment, emailDelivery)
- Redis Caching & Rate Limiting
- GST-compliant Invoice Generation (Supabase Edge Functions)
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
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

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
# PostgreSQL — use Supabase Session/Transaction pooler URI (port 6543) on IPv4-only networks
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

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

All app tables live in the **`ankshaastra`** schema: `orders`, `customer_details`, `payment`, and `emailDelivery` (for future email tracking). The API (`api/_utils/db.js`) creates them automatically.

**IPv6 note:** Supabase **direct** DB host (`db.*.supabase.co:5432`) is **IPv6-only** by default. Use the **Session** or **Transaction pooler** URI from the dashboard (usually `*.pooler.supabase.com`, port **6543**) so local dev and Vercel can connect on IPv4.

**For Supabase + Vercel (recommended):**

1. Create a project at [supabase.com](https://supabase.com) → **New Project**.
2. **Project Settings** → **Database** → **Connection string** → copy the **pooler** URI (not the direct host if you hit connection timeouts).
3. In Vercel: **Environment Variables** → set `DATABASE_URL` (encode `@` in password as `%40` if you build the URL by hand).
4. **Deploy** your app.

**Tables are created automatically** on first use (first order, first `/admin/orders` load, or first payment).

**Manual setup (optional):** same code path as the HTTP init endpoint.

```bash
npm run db:setup
```

Requires `DATABASE_URL` in `.env`. Same as `GET /api/admin/init-db?secret=...` — both use `initDatabaseSchema` in `api/admin/init-db.js` (CLI wrapper: `scripts/db-setup.mjs`).

**HTTP:** `GET /api/admin/init-db?secret=YOUR_INIT_DB_SECRET` — set `INIT_DB_SECRET` in Vercel.

## Development

```bash
npm run dev              # Start frontend only (Vite)
vercel dev               # Full stack: frontend + API (requires Vercel CLI)
npm run build            # Build for production
```

**Note:** For `/admin/orders` and payment APIs to work locally, use `vercel dev` (or deploy to Vercel).

**Note:** The `DEP0169` deprecation warning about `url.parse()` comes from dependencies (nodemailer, ioredis, etc.) and is automatically suppressed. This is safe as it's not from our code.

## Project Structure

### API Folder (`api/`)

Vercel Hobby plan allows max 12 serverless functions. Utility files are in `api/_utils/` (underscore prefix = ignored by Vercel):

- `api/initiate-payment.js` — Razorpay payment initiation endpoint
- `api/payment-status.js` — Payment status callback endpoint
- `api/payment-webhook.js` — Razorpay webhook endpoint
- `api/admin/init-db.js` — DB schema initialization endpoint
- `api/admin/order.js` — Admin orders endpoint
- `api/_utils/` — Shared utilities (db, encryption, rate-limiter, redis-cache, send-email, supabase-server, suppress-deprecation)

## Invoice Generation (Supabase)

Invoices are generated as PDF files via a Supabase Edge Function (`generate-invoice`) and stored in a Supabase Storage bucket. Invoice PDFs are also attached to customer and admin emails on successful payment.

### Supabase Storage Bucket Setup ✅

**Bucket `invoices` (private) required for PDF invoices.**

1. **Supabase Dashboard → Storage → New Bucket**:
   - Name: `invoices` 
   - **Public Bucket**: `false` (private)
   - File Size Limit: Default
   - Allowed MIME Types: `application/pdf`

2. **Add RLS Policies** (Dashboard → Storage → `invoices` → Policies → New Policy or SQL Editor):

```sql
-- Service role uploads (Edge fn + Vercel)
CREATE POLICY "Service role upload invoices" ON storage.objects FOR INSERT 
TO service_role WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Service role update invoices" ON storage.objects FOR UPDATE 
TO service_role USING (bucket_id = 'invoices');

-- Signed URL downloads (Vercel fetches PDF → email attach)
CREATE POLICY "Public signed URL reads" ON storage.objects FOR SELECT 
TO anon, authenticated USING (bucket_id = 'invoices');
```

3. **Vercel Env Vars** (already set per your confirmation):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Test Bucket**:
```
curl -X POST "https://your-project.supabase.co/storage/v1/object/invoices/test.pdf" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

**Path**: `/invoices/{year}/{month}/{safe_email}_{invoice_number}.pdf`

**Usage**: Auto-triggered on payment SUCCESS (webhook/status → Edge fn → Vercel attach → email).




These are automatically available in the Supabase Edge Function runtime. For the **frontend**, add to Vercel:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_ref
```

For the **Vercel serverless functions** (api/ folder), add these to Vercel Environment Variables so `api/_utils/supabase-server.js` can connect:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Invoice Email Delivery

On successful payment, the system:
1. Generates a GST-compliant PDF invoice via Supabase Edge Function
2. Stores the PDF in the `invoices` storage bucket (`/year/month/email_invoiceNumber.pdf`)
3. Attaches the PDF to the **customer email** (sent to the customer's email)
4. Attaches the PDF to the **admin email** (sent to `social@ankshaastra.com`)
5. Both emails are sent from `no-reply@ankshaastra.com` (configured via `FROM_EMAIL` env var)

### Invoice Data Configuration

Company details, bank details, UPI info, notes, and terms are defined in:
- **Edge Function**: `supabase/functions/generate-invoice/index.ts` (for PDF generation)
- **Email template**: `api/_utils/send-email.js` (inline invoice in email body)
- **Frontend template**: `public/invoice-data.json` (for client-side print preview)

**Important:** Keep all three files in sync when updating company/bank details.

### GST Logic

- **Intrastate** (Pincode 200000–289999): CGST 9% + SGST 9%
- **Interstate** (all other pincodes): IGST 18%
- HSN/SAC Code: 998399

### Invoice Actions

- **Generate single**: `POST /generate-invoice` with `{ "action": "generate", "orderId": "..." }`
- **Backfill all**: `POST /generate-invoice` with `{ "action": "backfill" }`
- **Download (signed URL)**: `POST /generate-invoice` with `{ "action": "download", "invoiceId": "..." }`

### File Structure in Storage

```
/invoices/{year}/{month}/{customer_email}_{invoice_number}.pdf
```

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
   - Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
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

- **ENOTFOUND / getaddrinfo:** Use the **Connection pooler** URL (not direct). In Supabase: Project Settings → Database → **Connection string** → choose **URI** under **Connection pooling** (port 6543, host `aws-0-XX.pooler.supabase.com`). Direct connection (`db.xxx.supabase.co`) can fail with ENOTFOUND.
- **Project paused:** Supabase free tier pauses after ~1 week inactivity. Go to dashboard → **Restore project**.
- **Tables auto-create** on first DB use. No manual step needed.
- **Payments not stored:** Ensure `DATABASE_URL` is set in Vercel with the pooler URL.
- Encode `@` in password as `%40`.

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
- [ ] `DATABASE_URL` set in Vercel (tables auto-create on first use)
- [ ] Redis URL set (if using Redis)
- [ ] `.env` not committed to git
- [ ] Rate limits tested
- [ ] Error handling tested

## License

Private - All rights reserved

---

**Ankshaastra** - Payment System

Last Updated: January 2025
