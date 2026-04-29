// functions/api/health.js — Cloudflare-native diagnostic endpoint
// Tests D1 database connectivity and module loads.

// import { setEnv } from './_utils/db-unified.js'; // Handled by adapter
import { getD1, d1Query } from './_utils/d1-db.js';
import * as suppressDeprecation from './_utils/suppress-deprecation.js';
import * as encryptionModule from './_utils/encryption.js';
import * as rateLimiterModule from './_utils/rate-limiter.js';
import * as dbUnifiedModule from './_utils/db-unified.js';
import * as redisCacheModule from './_utils/redis-cache.js';
import * as sendEmailModule from './_utils/send-email.js';
import * as d1DbModule from './_utils/d1-db.js';

export async function onRequest(context) {
  const { env } = context;

  // Inject env vars
  if (env && typeof env === 'object') {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') process.env[k] = v;
    }
  }
  setEnv(env);

  const diagnostics = {
    time: new Date().toISOString(),
    nodeVersion: process.version || '',
    platform: 'cloudflare-pages',
    envVars: {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_USER: !!process.env.SMTP_USER,
      FROM_EMAIL: !!process.env.FROM_EMAIL,
      ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
      // Pricing env vars (server-side validation)
      PACKAGE_SINGLE_PRICE: !!process.env.PACKAGE_SINGLE_PRICE,
      PACKAGE_PREMIUM_PRICE: !!process.env.PACKAGE_PREMIUM_PRICE,
      PACKAGE_NAMECHECK_1_PRICE: !!process.env.PACKAGE_NAMECHECK_1_PRICE,
      PACKAGE_CONSULTATION_PRICE: !!process.env.PACKAGE_CONSULTATION_PRICE,
    },
    modules: {},
    dbConnected: false,
    dbType: null,
    dbError: null,
  };

  const moduleMap = {
    'suppress-deprecation': suppressDeprecation,
    encryption: encryptionModule,
    'rate-limiter': rateLimiterModule,
    'db-unified': dbUnifiedModule,
    'redis-cache': redisCacheModule,
    'send-email': sendEmailModule,
    'd1-db': d1DbModule,
  };

  const modules = [
    { name: 'suppress-deprecation', exports: [] },
    { name: 'encryption', exports: ['encryptCustomerData', 'decryptCustomerData'] },
    { name: 'rate-limiter', exports: ['rateLimiter'] },
    { name: 'db-unified', exports: ['saveOrderAndCustomer', 'savePayment', 'getOrderFull'] },
    { name: 'redis-cache', exports: ['getRedisCache'] },
    { name: 'send-email', exports: ['sendPaymentEmail'] },
    { name: 'd1-db', exports: ['d1Query', 'd1Run'] },
  ];

  for (const mod of modules) {
    try {
      const imported = moduleMap[mod.name];
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

  // Test D1 database connectivity
  const d1 = getD1(env);
  if (d1) {
    diagnostics.dbType = 'd1';
    try {
      const result = await d1Query(d1, 'SELECT CURRENT_TIMESTAMP as now');
      diagnostics.dbConnected = true;
      diagnostics.dbNow = result.rows[0]?.now;
    } catch (e) {
      diagnostics.dbError = e.message;
      diagnostics.dbConnected = false;
    }
  } else {
    diagnostics.dbError = 'D1 binding (env.DB) not available';
  }

  return new Response(JSON.stringify(diagnostics, null, 2), {
    status: diagnostics.dbConnected ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
