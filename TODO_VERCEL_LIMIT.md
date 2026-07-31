# Vercel Serverless Function Limit

## Problem
Vercel Hobby plan allows **max 12** serverless functions. Previously `api/_utils/*` was inside `api/` and counted toward the limit.

## Solution
- Shared code lives in **`server/_utils/`** (outside `api/` — not counted)
- Handler logic lives in **`server/handlers/`**
- **`api/`** contains thin re-export files only (9 functions, under limit)

## Endpoints

| File | URL |
|------|-----|
| `api/health.js` | `/api/health` |
| `api/initiate-payment.js` | `/api/initiate-payment` |
| `api/payment-status.js` | `/api/payment-status` |
| `api/payment-webhook.js` | `/api/payment-webhook` |
| `api/whatsapp-webhook.js` | `/api/whatsapp-webhook` |
| `api/admin/init-db.js` | `/api/admin/init-db` |
| `api/admin/order.js` | `/api/admin/order` |
| `api/admin/orders.js` | `/api/admin/orders` |
| `api/admin/verify-order.js` | `/api/admin/verify-order` |

## Function count: **9** (Hobby limit: 12)

**Note:** Do not put utility modules under `api/` — only route entry files belong there.
