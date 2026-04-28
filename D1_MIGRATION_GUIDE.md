# Cloudflare D1 Migration Guide

## What Was Changed

Your Cloudflare Pages deployment now uses **Cloudflare D1 SQLite** instead of Supabase PostgreSQL. This eliminates connection issues because D1 is native to Workers and uses HTTP (no persistent TCP connections).

## Files Created

1. **`functions/api/_utils/d1-db.js`** — D1 SQLite adapter with all database operations
2. **`functions/api/_utils/db-unified.js`** — Auto-selects D1 (Cloudflare) or pg (fallback)

## Files Updated

1. **`functions/_adapter.js`** — Injects D1 env into unified DB layer
2. **`functions/api/health.js`** — Standalone health check with D1 support
3. **`functions/api/initiate-payment.js`** — Stores customer data in D1
4. **`functions/api/payment-webhook.js`** — Saves payment, generates PDF, sends emails
5. **`functions/api/admin/order.js`** — Reads orders from D1
6. **`wrangler.toml`** — D1 database binding added

---

## Step-by-Step Setup

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create D1 Database
```bash
wrangler d1 create ankshaastra-db
```

You will see output like:
```
✅ Successfully created DB 'ankshaastra-db' in region WEUR
   database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### 4. Update wrangler.toml
Open `wrangler.toml` and replace:
```toml
database_id = "00000000-0000-0000-0000-000000000000"
```
with your actual database ID from Step 3.

### 5. Bind D1 to Your Pages Project

**Option A: Via Wrangler CLI**
```bash
wrangler pages project bind d1 ankshaastra-db --project-name=ankshaastra-empower
```

**Option B: Via Cloudflare Dashboard**
1. Go to https://dash.cloudflare.com/
2. Pages → ankshaastra-empower → Settings → Functions
3. D1 Database Bindings → Add binding
4. Variable name: `DB`
5. Database: `ankshaastra-db`

### 6. Set Environment Variables

Go to Cloudflare Pages Dashboard → Settings → Environment Variables

**Required Secrets (click "Encrypt"):**
| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_SECRET` | From Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | From Razorpay Dashboard |
| `SMTP_HOST` | e.g., `smtp.gmail.com` |
| `SMTP_USER` | e.g., `your-email@gmail.com` |
| `SMTP_PASSWORD` | Gmail App Password or SMTP password |
| `ENCRYPTION_KEY` | Any long random string |

**Optional (for Supabase fallback):**
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

**Already in wrangler.toml (no need to add):**
- `SMTP_PORT = 587`
- `SMTP_SECURE = false`
- `FROM_EMAIL`
- `ADMIN_EMAIL`
- `VITE_RAZORPAY_KEY_ID`
- `WHATSAPP_ADMIN_NUMBER`

### 7. Deploy
```bash
git add .
git commit -m "Migrate to Cloudflare D1 SQLite"
git push origin main
```

---

## Verification

### Test 1: Health Check
Visit: `https://empower.ankshaastra.com/api/health`

Expected response:
```json
{
  "time": "2026-04-28T...",
  "platform": "cloudflare-pages",
  "dbConnected": true,
  "dbType": "d1",
  "dbNow": "2026-04-28 12:34:56",
  "modules": {
    "d1-db": { "ok": true },
    "db-unified": { "ok": true },
    "send-email": { "ok": true }
  }
}
```

### Test 2: Make a Payment
1. Fill the form and make a test payment
2. Check `/api/health` → should show data in D1
3. Check email inbox for:
   - Customer confirmation email with PDF invoice
   - Admin notification email with PDF invoice

### Test 3: Admin Dashboard
1. Go to admin dashboard
2. Orders should appear from D1

---

## Troubleshooting

### "dbConnected": false
- Check that D1 binding is set (Variable name = `DB`)
- Verify `database_id` in `wrangler.toml` is correct
- Check Cloudflare Pages Functions logs

### Emails not sending
- Verify SMTP_HOST, SMTP_USER, SMTP_PASSWORD are set
- For Gmail, use App Password (not regular password)
- Check Functions logs for SMTP errors

### "database_id mismatch"
- Make sure you created the D1 database and copied the correct ID
- The ID in `wrangler.toml` must match your actual D1 database

---

## Architecture

```
User Form Submit
      ↓
Cloudflare Pages Function (initiate-payment.js)
      ↓
D1 SQLite (stores customer data)
      ↓
Razorpay (payment)
      ↓
Webhook (payment-webhook.js)
      ↓
D1 SQLite (updates payment status)
      ↓
PDF Generation (pdf-lib)
      ↓
Email Send (nodemailer) → Customer + Admin with PDF
```

## Benefits of D1

✅ **No connection issues** — HTTP-based, no TCP pools  
✅ **Native to Cloudflare** — Same infra as Pages/Workers  
✅ **SQLite syntax** — Simple, well-understood  
✅ **Free tier** — 5M rows/day, 500MB storage  
✅ **No separate service** — Integrated billing  

## Rollback

If you need to rollback to Supabase PostgreSQL:
1. Revert `functions/` files to use `api/` imports
2. Or set `DATABASE_URL` env var and D1 will auto-fallback to pg
