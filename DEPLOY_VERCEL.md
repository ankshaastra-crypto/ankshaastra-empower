# Deploy on Vercel

This project is configured for Vercel with:

- Frontend: Vite build output (`dist`)
- Backend: Serverless API adapter at `api/[...route].js`
- Existing handlers: `functions/api/*` reused via adapter

---

## 1) Prerequisites

- Node.js 18+ (recommended 20+)
- Vercel account
- Vercel CLI installed:

```bash
npm i -g vercel
```

---

## 2) Link the project

From the project root:

```bash
vercel link
```

Choose your team/account and create/select the target project.

---

## 3) Add Environment Variables in Vercel

Go to: **Vercel Dashboard -> Project -> Settings -> Environment Variables**

Add these for **Production**, **Preview**, and **Development** as needed.

### Required: Payment + Email

```bash
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_SECURE=false

FROM_EMAIL=Ankshaastra <your_email@gmail.com>
ADMIN_EMAIL=your_admin_email@example.com

ENCRYPTION_KEY=your_32_plus_character_secret
```

### Required: Frontend build-time vars (Vite)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_ref
VITE_RAZORPAY_KEY_ID=rzp_live_xxx
```

### Required/Optional: Backend data layer

```bash
# If using Postgres/Supabase pooler for backend tables:
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# If invoice generation path is enabled:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
REDIS_URL=redis://...
NODE_ENV=production
NODE_OPTIONS=--no-deprecation
```

> For Gmail SMTP, use an **App Password** (not your normal Gmail password).

---

## 4) Deploy

### First deploy

```bash
vercel --prod
```

### Subsequent deploys

```bash
vercel --prod
```

---

## 5) Verify after deploy

1. Open your deployed site.
2. Create a test order from frontend.
3. Confirm API health:
   - `GET /api/health`
4. Complete a Razorpay test payment.
5. Confirm:
   - payment row created
   - order status updated
   - customer/admin emails received

---

## 6) Razorpay webhook setup

In Razorpay dashboard, set webhook URL to:

```text
https://<your-domain>/api/payment-webhook
```

Use the same secret value as `RAZORPAY_WEBHOOK_SECRET`.

---

## 7) Notes for this codebase

- API entrypoint on Vercel is `api/[...route].js`.
- It forwards requests to `functions/api/*` handlers.
- Do not remove `vercel.json` SPA route fallback.
- If you update any `VITE_*` variable, redeploy (Vite injects them at build time).

---

## 8) Quick troubleshooting

### Email not sending

- Check `SMTP_*` vars in Vercel.
- For Gmail: ensure 2FA enabled + App Password used.
- Check `FROM_EMAIL` format:
  - `Name <email@domain.com>` or `email@domain.com`

### Payment succeeds but callback fails

- Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard.
- Confirm webhook points to `/api/payment-webhook`.

### Admin panel blank

- Missing `VITE_SUPABASE_*` env vars or no redeploy after adding them.

### DB errors

- Verify `DATABASE_URL` uses reachable pooler host and valid credentials.

