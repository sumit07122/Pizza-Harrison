# 🍕 Pizza Harrison — Supabase Production Backend Setup Guide

**Author:** Antigravity AI Engineering  
**Primary Administrator:** `sumitdevthakur@gmail.com`  
**Target:** Supabase PostgreSQL with Row Level Security (RLS) & Realtime Subscriptions

---

## 1. Overview & Architecture

Pizza Harrison uses a **dual-mode resilient backend**:
- **Production Mode (Supabase PostgreSQL):** Activated whenever `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured. Orders, table bookings, customer accounts, inventory, and analytics are saved in PostgreSQL with Row Level Security.
- **Offline / Sandbox Fallback Mode:** If credentials are empty or during local offline development, the system automatically falls back to the in-memory transactional data store.

---

## 2. Fast 2-Minute Supabase Setup

### Step 1: Create Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and log in.
2. Click **New Project**, select your nearest region (e.g. `ap-south-1` Mumbai for India), set a database password, and create the project.

### Step 2: Run Full Schema in SQL Editor
1. In the Supabase project dashboard, navigate to the **SQL Editor** tab (left sidebar).
2. Click **New Query**.
3. Open [`supabase/schema_full.sql`](../supabase/schema_full.sql) in this repository, copy the entire SQL script, and paste it into the editor.
4. Click **Run** (or `Ctrl+Enter`).
   - This creates all 20+ tables, custom enums, Row Level Security policies, indexes, realtime replication, and authentic Mathura seed data (categories, pizzas, sizes, crusts, toppings, coupons).
   - Initializes `sumitdevthakur@gmail.com` as the root Super Administrator.

### Step 3: Copy API Credentials to `.env.local`
1. In Supabase, go to **Project Settings** → **API**.
2. Copy your:
   - **Project URL** (e.g., `https://abcdefghijkl.supabase.co`)
   - **anon / public key**
   - **service_role secret key**
3. Update `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Primary Administrator
PRIMARY_ADMIN_EMAIL="sumitdevthakur@gmail.com"
ADMIN_PASSWORD="PizzaHarrison@2026"
```

4. Restart your development server (`npm run dev`).
5. Open `/admin` — you will see the green **"Supabase Live"** badge!

---

## 3. Administrator Access Control

### Strict Access Rule
- The entire Admin Dashboard (`/admin` and all `/admin/*` subroutes) is **strictly restricted to `sumitdevthakur@gmail.com`**.
- All other users, customers, and guests view the **simple website** (`/`).
- If an unauthorized email attempts to sign in via `/admin/login`, the server returns a 403 Forbidden error:
  > *"Access Restricted: Only authorized store administrator (sumitdevthakur@gmail.com) can access management controls."*

### Security Layers
1. **Edge Middleware (`src/middleware.ts`):** Intercepts all `/admin/*` requests, verifies cryptographic HMAC signature of `ph_admin_session`, and validates email equality.
2. **Layout Level Guard (`src/app/admin/layout.tsx`):** Renders unauthorized card with direct link back to `/` if session does not belong to `sumitdevthakur@gmail.com`.
3. **API Level Guard (`src/lib/security/admin-auth.ts`):** Cryptographic verification on administrative mutations and data exports.
4. **Clean Storefront:** Public visitors never see "Staff KDS" or internal management links on the storefront.
