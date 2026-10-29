// Tells the hub to refresh the abandoned-carts Google Sheet right now.
// Best-effort: never throws, never blocks Empower's own flow for long.
const HUB_API_BASE = (process.env.HUB_API_BASE || 'https://ankshaastra.com/api').replace(/\/$/, '');
const SYNC_KEY = process.env.ABANDONED_SYNC_KEY;

export async function notifyHubSheetSync() {
  if (!SYNC_KEY) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    await fetch(`${HUB_API_BASE}/admin/abandoned-carts`, {
      method: 'POST',
      headers: { 'x-sync-key': SYNC_KEY },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
  } catch (err) {
    console.warn('[notify-hub-sheet] failed (non-fatal):', err?.message || err);
  }
}
