# How to Check Cloudflare Pages Function Logs

## Step-by-Step Guide

### Method 1: Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/
   ```

2. **Select Your Account**
   - Click on your account/organization name

3. **Navigate to Pages**
   - Click on **Pages** in the left sidebar

4. **Select Your Project**
   - Click on **ankshaastra-empower** project

5. **Go to Functions Tab**
   - Click on the **Functions** tab

6. **Select Function**
   - Click on the function you want to check logs for:
     - `payment-webhook` (most important for your issues)
     - `initiate-payment`
     - `payment-status`
     - `send-email`

7. **View Logs**
   - Click on **Logs** sub-tab
   - You can filter by:
     - **Time range** (Last 1 hour, 24 hours, etc.)
     - **Log level** (All, Error, Warn, Info, Debug)
     - **Search** for specific terms like "email", "SMTP", "database", etc.

---

## What You'll See in Logs

### For Payment Webhook Issues:
```
✅ Webhook signature verified
📊 Webhook: SUCCESS | event: payment.captured | order: [orderId] | tx: [transactionId]
✅ Payment saved to DB — order: [orderId], status: SUCCESS
📄 Generating invoice PDF for order: [orderId]
✅ Invoice PDF generated — [size] bytes
📧 Webhook sending emails for order [orderId] — customer: [email]
✅ Customer email sent successfully! Message ID: [id]
✅ Admin email sent successfully! Message ID: [id]
```

### Error Examples:
```
❌ SMTP configuration is missing
❌ Webhook signature mismatch — check RAZORPAY_WEBHOOK_SECRET matches Razorpay dashboard
❌ DB save payment error: [error message]
❌ PDF generation failed for [orderId]: [error]
❌ Failed to send customer email: [error]
```

---

## Method 2: Real-Time Logs (Live Debugging)

1. **Go to Functions Tab** (same as above)
2. **Click on a Function**
3. **Click "Logs"**
4. **Make a Test Payment** while watching logs
5. **See events appear in real-time**

---

## Method 3: Command Line (Advanced)

If you have Wrangler CLI installed:

```bash
# Install Wrangler (if not installed)
npm install -g wrangler

# Login to Cloudflare
wrangler auth login

# View logs for your project
wrangler tail --format=pretty
```

---

## Common Log Messages to Look For

### ✅ Success Indicators:
- `✅ Webhook signature verified`
- `✅ Payment saved to DB`
- `✅ Invoice PDF generated`
- `✅ Customer email sent successfully`
- `✅ Admin email sent successfully`

### ❌ Error Indicators:
- `❌ SMTP configuration is missing`
- `❌ Webhook signature mismatch`
- `❌ DB save payment error`
- `❌ PDF generation failed`
- `❌ Failed to send customer email`

### ⚠️ Warning Indicators:
- `⚠️ No customer email found for order`
- `⚠️ Order not found in DB — skipping PDF generation`
- `⚠️ Encryption unavailable — proceeding without encrypted URL data`

---

## Troubleshooting Common Issues

### "No logs showing up?"
- Make sure you're on the correct function (payment-webhook)
- Check time range filter
- Try refreshing the page
- Make a test payment to trigger logs

### "Logs show errors?"
- Check if environment variables are set correctly
- Verify SMTP credentials
- Check DATABASE_URL connection string
- Confirm RAZORPAY_WEBHOOK_SECRET matches Razorpay

### "Logs are too verbose?"
- Use search filter for specific terms
- Filter by log level (Error, Warn)
- Use time range to focus on recent activity

---

## Your Project Functions

Based on your code, these are the key functions to monitor:

| Function | Purpose | What to Look For |
|----------|---------|------------------|
| `payment-webhook` | Processes Razorpay webhooks | Email sending, DB storage, PDF generation |
| `initiate-payment` | Creates Razorpay orders | Order creation, DB storage |
| `payment-status` | Handles payment redirects | Email sending, status updates |
| `send-email` | Email sending utility | SMTP connection, email delivery |

---

## Quick Access Links

**Direct Links (replace with your account):**
- Dashboard: https://dash.cloudflare.com/
- Pages: https://dash.cloudflare.com/pages
- Your Project: https://dash.cloudflare.com/pages/[your-project-id]

---

## Tips for Effective Debugging

1. **Filter by recent time** (Last 1 hour) to avoid old logs
2. **Search for specific errors** like "SMTP" or "database"
3. **Make test payments** to trigger webhook logs
4. **Check both success and error logs**
5. **Look for the sequence**: Webhook → DB Save → PDF → Email Send

---

## If You Need Help

**Share these details when asking for help:**
- Function name (e.g., payment-webhook)
- Error message from logs
- Time when error occurred
- What you were doing when error happened

---

**Last Updated:** April 28, 2026
