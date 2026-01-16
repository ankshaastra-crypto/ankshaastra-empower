# Email Notification Setup Guide

This guide will help you set up email notifications for your payment system. When customers complete or fail a payment, both the customer and you (the admin) will receive email notifications automatically.

## What You Need

Before starting, make sure you have:

- An email account (Gmail, Outlook, Yahoo, or your business email)
- Access to your email account settings
- Your PhonePe merchant credentials (if you haven't set up payment gateway yet)

---

## Step-by-Step Setup Instructions

### Step 1: Choose Your Email Provider

You can use any of these email providers:

- **Gmail** (Recommended - easiest to set up)
- **Outlook/Office365**
- **Yahoo Mail**
- **Your business email** (if you have your own email server)

---

### Step 2: Set Up Gmail (Recommended for Beginners)

If you're using Gmail, follow these simple steps:

#### 2.1 Enable 2-Step Verification

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on **Security** (left sidebar)
3. Find **2-Step Verification** and click **Get Started**
4. Follow the prompts to enable 2-Step Verification
   - You'll need to verify your phone number
   - Google will send you a verification code

#### 2.2 Create an App Password

1. Still in **Security** settings, scroll down to find **2-Step Verification**
2. Click on **App passwords** (you may need to sign in again)
3. Under **Select app**, choose **Mail**
4. Under **Select device**, choose **Other (Custom name)**
5. Type "Ankshaastra Payment System" and click **Generate**
6. **IMPORTANT**: Copy the 16-character password that appears (it looks like: `abcd efgh ijkl mnop`)
   - You won't be able to see this password again!
   - Save it somewhere safe

#### 2.3 Add Gmail Settings to Your System

You'll need to add these settings to your `.env` file:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASSWORD=your_16_character_app_password
SMTP_REJECT_UNAUTHORIZED=true
FROM_EMAIL=Ankshaastra <your_gmail_address@gmail.com>
ADMIN_EMAIL=your_admin_email@gmail.com
```

**Replace:**

- `your_gmail_address@gmail.com` with your actual Gmail address
- `your_16_character_app_password` with the app password you just created (remove spaces)
- `your_admin_email@gmail.com` with the email where you want to receive payment notifications

---

### Step 3: Set Up Outlook/Office365

If you're using Outlook or Office365:

1. Go to your Microsoft Account settings
2. Enable 2-factor authentication (similar to Gmail)
3. Generate an app password for "Mail"

Add these settings to your `.env` file:

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASSWORD=your_app_password
SMTP_REJECT_UNAUTHORIZED=true
FROM_EMAIL=Ankshaastra <your_email@outlook.com>
ADMIN_EMAIL=your_admin_email@outlook.com
```

---

### Step 4: Set Up Yahoo Mail

If you're using Yahoo:

1. Go to Yahoo Account Security settings
2. Enable 2-factor authentication
3. Generate an app password

Add these settings to your `.env` file:

```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@yahoo.com
SMTP_PASSWORD=your_app_password
SMTP_REJECT_UNAUTHORIZED=true
FROM_EMAIL=Ankshaastra <your_email@yahoo.com>
ADMIN_EMAIL=your_admin_email@yahoo.com
```

---

### Step 5: Set Up Custom Business Email

If you have your own business email (like `info@yourcompany.com`):

1. Contact your email hosting provider or IT department
2. Ask them for:
   - SMTP server address (usually `mail.yourcompany.com` or `smtp.yourcompany.com`)
   - SMTP port (usually 587 or 465)
   - Your email username and password
   - Whether SSL/TLS is required

Add these settings to your `.env` file:

```
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@yourcompany.com
SMTP_PASSWORD=your_email_password
SMTP_REJECT_UNAUTHORIZED=true
FROM_EMAIL=Ankshaastra <your_email@yourcompany.com>
ADMIN_EMAIL=admin@yourcompany.com
```

---

### Step 6: Set Up Ankshaastra Email

If you're using Ankshaastra's email service:

Add these settings to your `.env` file:

```
SMTP_HOST=mail.ankshaastra.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@ankshaastra.com
SMTP_PASSWORD=password
SMTP_REJECT_UNAUTHORIZED=true
FROM_EMAIL=Ankshaastra <noreply@ankshaastra.com>
ADMIN_EMAIL=social@ankshaastra.com
```

**Note:**

- SMTP server: `mail.ankshaastra.com`
- SMTP user: `noreply@ankshaastra.com` (for sending emails)
- Admin email: `social@ankshaastra.com` (for receiving notifications)
- IMAP server: `imap.ankshaastra.com` (for receiving emails)
- POP server: `pop.ankshaastra.com` (for receiving emails)
- Replace `password` with the actual password for `noreply@ankshaastra.com`

**Alternative Port Settings:**
If port 587 doesn't work, try:

- Port `465` with `SMTP_SECURE=true` (for SSL)

---

## How to Add Settings to Your System

### For Local Testing (On Your Computer)

1. Open the `.env` file in your project folder
2. Replace the placeholder values with your actual email settings
3. Save the file
4. Restart your development server

### For Production (On Vercel/Your Hosting)

1. Log in to your Vercel account (or hosting provider)
2. Go to your project settings
3. Click on **Environment Variables**
4. Add each setting one by one:
   - Click **Add New**
   - Enter the variable name (e.g., `SMTP_HOST`)
   - Enter the value (e.g., `smtp.gmail.com`)
   - Click **Save**
5. Repeat for all variables
6. Redeploy your application

---

## What Happens After Setup?

Once configured, the system will automatically:

✅ **Send confirmation email to customers** when payment is successful

- Includes order details
- Shows amount paid
- Provides next steps

✅ **Send notification email to you (admin)** when payment is successful

- Includes all order details
- Customer information
- Transaction ID

❌ **Send failure notification** if payment fails

- Customer receives failure notice
- You receive admin notification

---

## Common Issues and Solutions

### Problem: Emails are not sending

**Solution:**

1. ✅ Double-check your email address and password are correct
2. ✅ For Gmail, make sure you're using an **App Password**, not your regular password
3. ✅ Verify that 2-factor authentication is enabled
4. ✅ Check that SMTP_PORT matches your provider (587 for most, 465 for some)
5. ✅ Make sure your firewall/network allows email connections

### Problem: "Authentication failed" error

**Solution:**

- For Gmail: Make sure you created an App Password (not using your regular password)
- Check that your email and password don't have extra spaces
- Verify 2-factor authentication is enabled

### Problem: "Connection timeout" error

**Solution:**

- Check your internet connection
- Verify the SMTP_HOST is correct for your email provider
- Try changing SMTP_PORT to 465 and SMTP_SECURE to true
- Check if your firewall is blocking the connection

### Problem: Emails going to spam folder

**Solution:**

- This is normal for new email setups
- Ask customers to check their spam folder
- Over time, as you send more emails, this should improve
- Consider setting up SPF/DKIM records with your email provider (advanced)

---

## Testing Your Setup

To test if your email setup is working:

1. Make a test payment (use PhonePe test mode if available)
2. Check your email inbox (and spam folder)
3. Check the customer's email inbox
4. If emails arrive, your setup is successful! 🎉

---

## Quick Reference: Email Provider Settings

### Gmail

- Host: `smtp.gmail.com`
- Port: `587`
- Secure: `false`
- Requires: App Password (not regular password)

### Outlook/Office365

- Host: `smtp.office365.com`
- Port: `587`
- Secure: `false`
- Requires: App Password

### Yahoo

- Host: `smtp.mail.yahoo.com`
- Port: `587`
- Secure: `false`
- Requires: App Password

### Ankshaastra

- Host: `mail.ankshaastra.com`
- Port: `587` (or `465` with secure: `true`)
- Secure: `false` (or `true` if using port 465)
- SMTP User: `noreply@ankshaastra.com`
- Admin Email: `social@ankshaastra.com`
- IMAP: `imap.ankshaastra.com`
- POP: `pop.ankshaastra.com`

---

## Need Help?

If you're still having trouble:

1. Check the error messages in your server logs
2. Verify all settings are correct
3. Try testing with a different email provider
4. Contact support: **9667305577**

---

## Important Notes

⚠️ **Security Tips:**

- Never share your email password or app password
- Keep your `.env` file secure and never commit it to public repositories
- Use strong, unique passwords
- Regularly update your passwords

📧 **Email Limits:**

- Gmail: 500 emails per day (free account)
- Outlook: 300 emails per day (free account)
- For higher volumes, consider a business email service

✅ **Best Practices:**

- Use a dedicated email account for sending notifications
- Monitor your email sending to avoid hitting limits
- Set up proper email authentication (SPF/DKIM) for better deliverability

---

**Last Updated:** January 2025
