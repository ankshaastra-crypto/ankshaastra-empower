// functions/api/health.js — Standalone Cloudflare-native diagnostic endpoint
// Uses STATIC imports so bundler includes all modules correctly.
// Tests D1 database connectivity (primary) and Supabase fallback.

import { setEnv } from './_utils/db-unified.js';
import { getD1, d1Query } from './_utils/d1-db.js';
import { createClient } from '@supabase/supabase-js';
import * as suppressDeprecation from './_utils/suppress-deprecation.js';
import * as encryptionModule from './_utils/encryption.js';
import * as rateLimiterModule from './_utils/rate-limiter.js';
import * as dbUnifiedModule from './_utils/db-unified.js';
import * as redisCacheModule from './_utils/redis-cache.js';
import * as sendEmailModule from './_utils/send-email.js';
import * as supabaseServerModule from './_utils/supabase-server.js';
import * as d1DbModule from './_utils/d1-db.js';

export async function onRequest(context) {
  const { request, env } = context;

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
      DATABASE_URL: !!process.env.DATABASE_URL,
      REDIS_URL: !!process.env.REDIS_URL,
      ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      FROM_EMAIL: !!process.env.FROM_EMAIL,
      ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    },
    modules: {},
    dbConnected: false,
    dbType: null,
    dbError: null,
  };

  // ─── Test module loads (static imports) ───────────────────────────────────
  const moduleMap = {
    'suppress-deprecation': suppressDeprecation,
    encryption: encryptionModule,
    'rate-limiter': rateLimiterModule,
    'db-unified': dbUnifiedModule,
    'redis-cache': redisCacheModule,
    'send-email': sendEmailModule,
    'supabase-server': supabaseServerModule,
    'd1-db': d1DbModule,
  };

  const modules = [
    { name: 'suppress-deprecation', exports: [] },
    { name: 'encryption', exports: ['encryptCustomerData', 'decryptCustomerData'] },
    { name: 'rate-limiter', exports: ['rateLimiter'] },
    { name: 'db-unified', exports: ['saveOrderAndCustomer', 'savePayment', 'getOrderFull'] },
    { name: 'redis-cache', exports: ['getRedisCache'] },
    { name: 'send-email', exports: ['sendPaymentEmail'] },
    { name: 'supabase-server', exports: ['generateInvoicePDF'] },
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

  // ─── Test D1 database connectivity ────────────────────────────────────────
  const d1 = getD1(env);
  if (d1) {
    diagnostics.dbType = 'd1';
    try {
      const result = await d1Query(d1, 'SELECT CURRENT_TIMESTAMP as now');
      diagnostics.dbConnected = true;
      diagnostics.dbNow = result.rows[0]?.now;
      diagnostics.dbRows = result.rows;
    } catch (e) {
      diagnostics.dbError = e.message;
      diagnostics.dbConnected = false;
    }
  }

  // ─── Fallback: test Supabase connectivity ─────────────────────────────────
  if (!diagnostics.dbConnected && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    diagnostics.dbType = 'supabase';
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data, error } = await supabase.from('orders').select('count').limit(1);
      if (error) throw error;
      diagnostics.dbConnected = true;
      diagnostics.dbNow = new Date().toISOString();
      diagnostics.dbFallback = 'supabase';
    } catch (e) {
      diagnostics.dbError = e.message;
      diagnostics.dbConnected = false;
    }
  }

  // ─── Fallback: test pg Pool connectivity ──────────────────────────────────
  if (!diagnostics.dbConnected && process.env.DATABASE_URL) {
    diagnostics.dbType = 'pg';
    try {
      const { getPool } = await import(new URL('./_utils/db.js', import.meta.url));
      const pool = getPool();
      if (pool) {
        const result = await pool.query('SELECT NOW() as now');
        diagnostics.dbConnected = true;
        diagnostics.dbNow = result.rows[0]?.now;
      } else {
        diagnostics.dbError = 'No DATABASE_URL configured';
      }
    } catch (e) {
      diagnostics.dbError = e.message;
      diagnostics.dbConnected = false;
    }
  }

  // Always return 200 with full diagnostics (even if DB is down)
  // This allows the endpoint to report status without appearing broken
  const allOk = Object.values(diagnostics.modules).every(m => m.ok);
  const statusCode = allOk ? 200 : 500;

  return new Response(JSON.stringify(diagnostics, null, 2), {
    status: diagnostics.dbConnected ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
