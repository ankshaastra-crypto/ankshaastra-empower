## Architecture

```
Supabase (orders table) → Edge Function (sync) → Firestore
                                                      ↓
                                            React Admin Dashboard
                                            (Firebase Auth + Firestore queries)
```

## Phase 1: Firebase Setup
- Install `firebase` npm package
- Create Firebase config file with publishable keys
- Store Firebase Admin credentials as secrets (for edge function)
- Set up Firebase Auth for admin login

## Phase 2: Data Sync (Supabase → Firestore)
- Create a Supabase Edge Function `sync-to-firestore` that:
  - Reads orders from Supabase
  - Writes/updates documents in Firestore `orders` collection
- Can be triggered manually from dashboard or via scheduled cron

## Phase 3: Firestore Schema
```
orders/{order_id}
  ├── customer_name
  ├── customer_email
  ├── customer_mobile
  ├── customer_city
  ├── package_type (service_type)
  ├── amount
  ├── status (pending / delivered / follow-up)
  ├── payment_status
  ├── order_date
  ├── source (ads / organic / referral)
  ├── notes: string
  ├── tags: string[] (hot_lead / cold_lead)
  ├── follow_up_date
  ├── person details (1-3)
  ├── baby name details
  └── synced_at
```

## Phase 4: Admin Dashboard Pages
- `/admin/login` — Firebase Auth login
- `/admin/dashboard` — Main dashboard with:
  - **Overview metrics**: Total orders, revenue, pending vs completed
  - **Orders table**: Paginated, searchable, sortable
  - **Filters**: Date range, service type, payment status, source, status
  - **Actions**: Update status, add notes, mark follow-up, export CSV
  - **WhatsApp button** per customer
  - **Tag system** (hot/cold lead)

## Phase 5: Auth & Security
- Firebase Auth email/password for admin
- Protected routes — only authenticated admins can access
- Firestore security rules (read/write only for authenticated admins)

## Prerequisites from you:
1. **Firebase project** — You'll need to create one at console.firebase.google.com
2. **Firebase config** — The publishable config object (apiKey, authDomain, projectId, etc.)
3. **Firebase Admin Service Account Key** — JSON key for the edge function to write to Firestore
4. **Create an admin user** in Firebase Auth console

Shall I proceed?
