# Fix Plan: Migrate from Supabase/pg to Cloudflare D1 SQLite

## ✅ COMPLETED STEPS

### Step 1: D1 Database Adapter Created
- ✅ `functions/api/_utils/d1-db.js` — Full D1 SQLite adapter with all CRUD operations
- ✅ Schema auto-creates on first use (orders, customer_details, payment, emailDelivery, invoices, invoice_sequence)
- ✅ All 41 customer fields supported

### Step 2: Unified DB Layer Created
- ✅ `functions/api/_utils/db-unified.js` — Auto-selects D1 (Cloudflare) or pg (fallback)
- ✅ Same API as original db.js — zero changes needed to business logic
- ✅ `setEnv()` injects D1 binding from Cloudflare context

### Step 3: Cloudflare Adapter Updated
- ✅ `functions/_adapter.js` — Now injects env into unified DB layer

### Step 4: Critical Function Handlers Rewritten
- ✅ `functions/api/health.js` — Standalone D1 health check, returns 200 with diagnostics
- ✅ `functions/api/initiate-payment.js` — Stores customer data in D1, creates Razorpay order
- ✅ `functions/api/payment-webhook.js` — Saves payment, generates PDF, sends emails via D1
- ✅ `functions/api/admin/order.js` — Reads orders from D1 for admin dashboard

### Step 5: Wrangler Config Updated
- ✅ `wrangler.toml` — D1 database binding added (`binding = "DB"`)

## 🔧 NEXT STEPS (User Action Required)

### Step 6: Create D1 Database in Cloudflare
```bash
# Install wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create ankshaastra-db

# This will output a database_id like:
# database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Step 7: Update wrangler.toml with Database ID
Replace `database_id = "00000000-0000-0000-0000-000000000000"` in `wrangler.toml`
with the actual ID from Step 6.

### Step 8: Bind D1 to Pages Project
```bash
# If using Wrangler CLI
wrangler pages project bind d1 ankshaastra-db --project-name=ankshaastra-empower
```

Or via Cloudflare Dashboard:
1. Go to https://dash.cloudflare.com/
2. Pages → ankshaastra-empower → Settings → Functions
3. D1 Database Bindings → Add binding
4. Variable name: `DB`
5. Database: `ankshaastra-db`

### Step 9: Set Environment Variables
In Cloudflare Pages Dashboard → Settings → Environment Variables:
- `RAZORPAY_KEY_SECRET` (Secret)
- `RAZORPAY_WEBHOOK_SECRET` (Secret)
- `SMTP_HOST` (e.g., `smtp.gmail.com`)
- `SMTP_USER` (e.g., `your-email@gmail.com`)
- `SMTP_PASSWORD` (Secret - App Password)
- `ENCRYPTION_KEY` (Secret)
- `SUPABASE_URL` (optional fallback)
- `SUPABASE_SERVICE_ROLE_KEY` (optional fallback)

### Step 10: Deploy
```bash
git add .
git commit -m "Migrate to Cloudflare D1 SQLite database"
git push origin main
```

### Step 11: Verify
1. Visit `https://empower.ankshaastra.com/api/health`
2. Should return JSON with `"dbConnected": true`, `"dbType": "d1"`
3. Make a test payment
4. Check that customer data appears in D1
5. Verify email with PDF attachment is received

## 📁 FILES CHANGED

| File | Status |
|------|--------|
| `functions/_adapter.js` | ✅ Updated |
| `functions/api/health.js` | ✅ Rewritten |
| `functions/api/initiate-payment.js` | ✅ Rewritten |
| `functions/api/payment-webhook.js` | ✅ Rewritten |
| `functions/api/admin/order.js` | ✅ Rewritten |
| `functions/api/_utils/d1-db.js` | ✅ Created |
| `functions/api/_utils/db-unified.js` | ✅ Created |
| `wrangler.toml` | ✅ Updated |

## 🔄 BACKWARD COMPATIBILITY

- Vercel/Netlify deployments still work via `api/` folder (original pg code preserved)
- Cloudflare Pages uses `functions/` folder (new D1 code)
- Unified DB layer auto-detects environment and selects correct backend
