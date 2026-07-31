// server/_utils/supabase-hub.js
// Client for the SHARED Ankshaastra hub Supabase project (the one that
// powers the admin panel's Orders + CRM modules for all connected sites).
// Deliberately separate from server/_utils/supabase-server.js, which talks
// to Empower's own Supabase project (invoice PDF storage only) — the two
// must never be pointed at the same env vars by accident.

import { createClient } from '@supabase/supabase-js';

const hubUrl = process.env.HUB_SUPABASE_URL;
const hubServiceKey = process.env.HUB_SUPABASE_SERVICE_ROLE_KEY;

export const supabaseHub =
  hubUrl && hubServiceKey
    ? createClient(hubUrl, hubServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

if (!supabaseHub) {
  console.warn(
    '⚠️  HUB_SUPABASE_URL / HUB_SUPABASE_SERVICE_ROLE_KEY missing — orders will not sync to the Ankshaastra CRM.'
  );
}