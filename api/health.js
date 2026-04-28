// api/health.js — Diagnostic endpoint to verify API routing and module loading
export default async function handler(req, res) {
  const diagnostics = {
    time: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.env.VERCEL ? 'vercel' : process.env.NETLIFY ? 'netlify' : 'unknown',
    envVars: {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      REDIS_URL: !!process.env.REDIS_URL,
      ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      FROM_EMAIL: !!process.env.FROM_EMAIL,
      ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    },
    modules: {}
  };

  // Test each module load
  const modules = [
    { name: 'suppress-deprecation', path: './_utils/suppress-deprecation.js' },
    { name: 'encryption', path: './_utils/encryption.js', exports: ['encryptCustomerData', 'decryptCustomerData'] },
    { name: 'rate-limiter', path: './_utils/rate-limiter.js', exports: ['rateLimiter'] },
    { name: 'db', path: './_utils/db.js', exports: ['saveOrderAndCustomer', 'savePayment', 'getPool'] },
    { name: 'redis-cache', path: './_utils/redis-cache.js', exports: ['getRedisCache'] },
    { name: 'send-email', path: './_utils/send-email.js', exports: ['sendPaymentEmail'] },
    { name: 'supabase-server', path: './_utils/supabase-server.js', exports: ['generateInvoicePDF'] },
  ];

  for (const mod of modules) {
    try {
      const imported = await import(mod.path);
      const available = {};
      if (mod.exports) {
        for (const exp of mod.exports) {
          available[exp] = typeof imported[exp] === 'function';
        }
      }
      diagnostics.modules[mod.name] = { ok: true, available };
    } catch (e) {
      diagnostics.modules[mod.name] = { ok: false, error: e.message };
    }
  }

  // Test DB connectivity (optional, non-blocking)
  try {
    const { getPool } = await import('./_utils/db.js');
    const pool = getPool();
    if (pool) {
      const result = await pool.query('SELECT NOW() as now');
      diagnostics.dbConnected = true;
      diagnostics.dbNow = result.rows[0]?.now;
    } else {
      diagnostics.dbConnected = false;
      diagnostics.dbError = 'No DATABASE_URL configured';
    }
  } catch (e) {
    diagnostics.dbConnected = false;
    diagnostics.dbError = e.message;
  }

  const allOk = Object.values(diagnostics.modules).every(m => m.ok);
  res.status(allOk ? 200 : 500).json(diagnostics);
}
