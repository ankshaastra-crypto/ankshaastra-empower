💳 Razorpay (causing your current error)
VariableWhere to get it

RAZORPAY_KEY_ID = Razorpay Dashboard → Settings → API Keys
RAZORPAY_KEY_SECRET = Razorpay Dashboard → Settings → API Keys
RAZORPAY_WEBHOOK_SECRET = Razorpay Dashboard → Webhooks → your webhook secret

🗄️ Database

DATABASE_URL = Your PostgreSQL connection stringSUPABASE_URLSupabase project URLSUPABASE_KEYSupabase anon/public key
SUPABASE_SERVICE_ROLE_KEY = Supabase service role key (admin)

📧 Email / SMTP

EMAIL_USER = Sender email address
EMAIL_PASS = Email password / app password
FROM_EMAIL = From address shown to recipients
SMTP_HOST = e.g. smtp.gmail.com
SMTP_PORT = e.g. 587
SMTP_USER = SMTP username
SMTP_PASSWORD = SMTP password
SMTP_SECURE = true or false
RESEND_API_KEY = If using Resend for email

💬 WhatsApp

WHATSAPP_TOKEN = Meta/WhatsApp Business API token
WHATSAPP_PHONE_NUMBER_ID = WhatsApp phone number ID
WHATSAPP_VERIFY_TOKEN = Your webhook verify token
WHATSAPP_ADMIN_NUMBER = Admin WhatsApp number

🔐 Security / Admin

ENCRYPTION_KEY = Secret key for encrypting data
ADMIN_EMAIL = Admin email address
ADMIN_VERIFY_TOKEN = Token for admin verification
INIT_DB_SECRET = Secret to protect the DB init endpoint
EMAIL_TEST_SECRET = Secret for test email endpoint

⚡ Optional (Redis cache)

REDIS_URL = Redis connection URL (e.g. Upstash)