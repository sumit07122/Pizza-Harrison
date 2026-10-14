# Pizza Harrison - Deployment & Operations Guide

## 1. Environment Configuration

The application requires the following environment variables. An `.env.example` file is provided in the repository root.

```ini
# App Configuration
NEXT_PUBLIC_SITE_URL=https://pizzaharrison.com
NEXT_PUBLIC_APP_ENV=production

# Supabase Public Keys (Safe for Client)
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Supabase Server Key (CONFIDENTIAL - NEVER EXPOSE TO CLIENT)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Restaurant Operational Config
NEXT_PUBLIC_RESTAURANT_NAME="Pizza Harrison"
NEXT_PUBLIC_RESTAURANT_CITY="Mathura"
NEXT_PUBLIC_RESTAURANT_PHONE="+91 94100 85555"
NEXT_PUBLIC_RESTAURANT_EMAIL="hello@pizzaharrison.com"

# Payment Gateways (Optional / When Configured)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
```

---

## 2. Database Migration & Supabase Setup

### 2.1 Automated Schema Migration
All SQL files reside in `supabase/migrations/`:
1. Navigate to your Supabase Project Dashboard -> **SQL Editor**.
2. Run `supabase/migrations/00001_initial_schema.sql` to construct tables, types, indexes, and RLS policies.
3. Run `supabase/migrations/00002_seed_data.sql` to populate authentic Pizza Harrison Mathura menu categories, pizzas, crust options, toppings, student coupons, and branch settings.
4. Enable **Supabase Realtime** for the `orders` and `bookings` tables in **Database -> Publications -> supabase_realtime**.

### 2.2 Storage Bucket Configuration
1. In Supabase Dashboard, create a public bucket named `product-images`.
2. Set public read access policy:
   ```sql
   CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
   ```

---

## 3. Vercel Deployment Workflow

1. Push your repository to GitHub.
2. Log into [Vercel](https://vercel.com) and click **Add New Project**.
3. Import the repository.
4. Set Framework Preset: **Next.js**.
5. Configure the Environment Variables listed in Section 1.
6. Click **Deploy**. Vercel will run `npm run build` and provision the global edge CDN.

---

## 4. Graceful Fallback & Offline Resilience Mode

When running in local development or in an environment without configured Supabase credentials:
- The system automatically detects the absence of live Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`).
- It seamlessly engages the **Local Storage & In-Memory Data Provider**.
- This provider loads the complete authentic menu of Pizza Harrison Mathura, supports cart operations, saves orders to local storage, enables live order tracking, records table bookings, and powers the `/admin` dashboard.
- Every button, modal, filter, and state change works authentically without failing or showing dead screens.
- When live Supabase credentials are subsequently provided, the application switches over to PostgreSQL cloud persistence without code modifications.

---

## 5. Production Health Checks & Verification

After deployment, verify the following health checkpoints:
1. `GET /` -> Returns 200 OK with fast first contentful paint (<1.2s).
2. `GET /menu` -> Returns 200 OK with all categories and pizzas rendered.
3. `POST /api/coupons/validate` with `{"code":"GLA100", "subtotal_paise": 60000}` -> Returns `{ valid: true, discount_paise: 10000 }`.
4. Order placement -> Creates order, returns tracking token, loads `/order-tracking/[code]`.
5. Admin login -> Role verified, displays live orders without console errors.
