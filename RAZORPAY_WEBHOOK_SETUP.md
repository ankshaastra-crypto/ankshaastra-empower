# Razorpay Webhook Configuration

## Webhook URL to Add

Your webhook endpoint is deployed on Cloudflare Pages:

```
https://your-domain.com/api/payment-webhook
```

Replace `your-domain.com` with your actual Cloudflare Pages domain or custom domain.

---

## How to Add Webhook to Razorpay Dashboard

### Step 1: Go to Razorpay Dashboard
1. Visit: https://dashboard.razorpay.com/
2. Log in to your account
3. Go to: **Settings** → **Webhooks**

### Step 2: Add New Webhook
1. Click **+ Add New Webhook**
2. Paste your webhook URL: `https://your-domain.com/api/payment-webhook`
3. Select **Active** status

### Step 3: Select Events to Monitor

**Select these events (CRITICAL for payment processing):**

- ✅ `payment.authorized`
- ✅ `payment.captured`
- ✅ `payment.failed`
- ✅ `order.paid`
- ✅ `order.partially_paid`

**Recommended to also enable:**

- ✅ `payment.method_added` (for saved payment methods)
- ✅ `refund.created` (if offering refunds)
- ✅ `refund.failed` (if offering refunds)

### Step 4: Copy the Webhook Secret

1. After creating the webhook, Razorpay displays a **Secret** value
2. **Copy this secret** - this is your `RAZORPAY_WEBHOOK_SECRET`
3. Add it to Cloudflare Pages:
   - Settings → Environment variables → Add Secret
   - Name: `RAZORPAY_WEBHOOK_SECRET`
   - Value: Paste the secret
   - Click "Encrypt"

### Step 5: Test the Webhook

1. In Razorpay Dashboard, click the webhook URL
2. Scroll down and click **Test Webhook**
3. You should see a `200 OK` response
4. Check Cloudflare Logs to verify webhook was received

---

## What Events Your Code Handles

Your webhook handler processes these specific events:

| Event | What It Does |
|-------|-------------|
| `payment.captured` | Payment successful - sends confirmation email + stores order |
| `order.paid` | Order marked paid - triggers email & data storage |
| Other events | Logged but not processed (safe to enable) |

**Key Status Checks:**
- If `paymentEntity.status === 'captured'` → **SUCCESS**
- If `paymentEntity.status === 'paid'` → **SUCCESS**
- Otherwise → **FAILED**

---

## Your Domain

### If using Cloudflare Pages URL
Your domain is typically:
```
https://[project-name].[your-account].pages.dev
```

To find your exact URL:
1. Go to Cloudflare Pages
2. Select **ankshaastra-empower** project
3. Copy the domain from the project header

### If using custom domain
Use your custom domain:
```
https://yourdomain.com/api/payment-webhook
```

---

## Webhook Flow

Here's what happens when Razorpay sends a webhook:

```
1. Customer completes payment on Razorpay
   ↓
2. Razorpay sends webhook to: /api/payment-webhook
   ↓
3. Webhook handler verifies signature using RAZORPAY_WEBHOOK_SECRET
   ↓
4. If valid, saves payment to database
   ↓
5. Generates invoice PDF
   ↓
6. Sends email to customer with PDF
   ↓
7. Sends email to admin with PDF + form data
   ↓
8. Returns 200 OK to Razorpay
```

---

## Verification Checklist

After adding the webhook:

- [ ] Webhook URL is correct format: `https://[domain]/api/payment-webhook`
- [ ] Events selected: `payment.captured`, `payment.failed`, `order.paid`
- [ ] Webhook status: **Active**
- [ ] Secret copied and added to Cloudflare as `RAZORPAY_WEBHOOK_SECRET`
- [ ] Webhook test passed (200 OK response)
- [ ] Logs show webhook events being received

---

## Troubleshooting

### Webhook not triggering?
1. Verify URL is correct and accessible from internet
2. Check webhook is marked as **Active** in Razorpay
3. Make sure events are selected
4. Check Razorpay delivery logs for any errors

### Signature mismatch error?
1. Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
2. Check that secret is added to Cloudflare (not just wrangler.toml)
3. Try generating a new secret in Razorpay and update Cloudflare

### Emails not sending after webhook?
1. Check if `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` are set
2. Check Cloudflare function logs for email errors
3. Verify payment was marked SUCCESS (not FAILED)

---

## Important Notes

⚠️ **The webhook secret is sensitive** - keep it secure!

✅ **Always use "Encrypt" checkbox** in Cloudflare when adding `RAZORPAY_WEBHOOK_SECRET`

✅ **Test webhook after adding** to ensure connectivity

---

## File References

- **Webhook Handler:** [api/payment-webhook.js](../api/payment-webhook.js)
- **Route Mapping:** [functions/_adapter.js](../_adapter.js)
- **Webhook Configuration:** Razorpay Dashboard → Settings → Webhooks

---

**Last Updated:** April 28, 2026
