# Pizza Harrison — Senior QA, Security & Production Release Report

**Application:** Pizza Harrison Restaurant Platform (Storefront & Administration)  
**Location:** Mathura, Uttar Pradesh, India (Outlets: Pali Khera & GLA University Campus)  
**Operating Stack:** Next.js 16 (App Router & Turbopack), React 19, TypeScript 5, Tailwind CSS, PostgreSQL / Supabase, Custom Exact Paise Pricing Engine  
**Audit Date:** October 14, 2026  
**Auditor / Release Role:** Independent Senior QA Engineer, Security Reviewer & Release Architect  

---

## 1. Executive Summary

Pizza Harrison's full-stack restaurant operating system has been audited, built, and end-to-end verified across both customer-facing storefront workflows and mission-critical admin operations.

All 44 Next.js routes and API endpoints compiled with **zero TypeScript errors** (`tsc --noEmit` exit code 0; `next build` exit code 0). Automated test suites executed with **100% pass rates** across monetary calculations (17/17 tests passed) and administrative RBAC / order state machine rules (37/37 tests passed).

---

## 2. Automated Test Execution & Pass/Fail Audit

### Test Suite 1: Exact Paise Monetary & Pricing Calculation Engine
- **Command:** `npx.cmd tsx src/lib/pricing/pricing.test.ts`
- **Result:** **17/17 Passed (100% Pass Rate)**
- **Coverage:**
  1. `formatINR`: Whole rupee formatting (e.g. ₹349).
  2. `formatINR`: Decimal fraction formatting for paise.
  3. `calculateItemUnitPricePaise`: Base price + variant + crust + multi-addon aggregation (e.g. Medium 349 + Cheese Burst 99 + Extra Cheese 49 + Olives 35 = ₹532).
  4. `calculateCartSubtotalPaise`: Quantity-weighted cart accumulation.
  5. `calculateCouponDiscountPaise`: 20% discount capped at maximum cap of ₹120.
  6. Minimum order threshold rejection (e.g. GLA100 rejected below ₹499).
  7. Flat discount deduction (e.g. ₹100 flat off).
  8. Free delivery fee threshold enforcement (free above ₹499; ₹40 base fee below).
  9. Fulfillment type overrides (Pickup / Takeaway always incurs ₹0 delivery fee).
  10. Exact 5% Restaurant GST calculation.
  11. End-to-end full bill calculation: subtotal, discount, delivery fee, tax, eco-packaging, and final payable amount.

### Test Suite 2: Administrative RBAC & Operations Machine
- **Command:** `npx.cmd tsx src/lib/admin/admin.test.ts`
- **Result:** **37/37 Passed (100% Pass Rate)**
- **Coverage:**
  1. **RBAC Rules:**
     - Owner role: Full business administration, staff role changes, settings modifications, financials access.
     - Manager role: Orders, table bookings, menu editing, coupons, financial reports permitted; staff role changes strictly denied.
     - Order staff: Customer order dispatch, table reservations, direct customer calling; financials denied.
     - Kitchen staff: High-contrast KDS pipeline access only; financial metrics, staff administration, and unrestricted customer directory access strictly blocked.
  2. **Order State Machine:**
     - Legal forward progression verified: `placed` → `confirmed` → `preparing` → `out_for_delivery` → `completed`.
     - Illegal status jump rejected: `preparing` → `completed` directly blocked.
     - Cancellation state verified: Unfulfilled orders can be cancelled with audit log reason and refund flag; already completed/delivered orders cannot be cancelled.
  3. **Strict Menu Price Rules:**
     - Unverified prices cannot be published (`is_available: true` with `is_price_verified: false` is rejected with 400 Bad Request).
     - Revoking price verification automatically pulls product from customer storefront availability.
  4. **Coupon Engine:**
     - Minimum cart thresholds, maximum discount caps, inactive coupon rejection, and expired coupon checks verified.
  5. **Customer Directory:**
     - Automatic grouping by mobile number, accurate lifetime spend accumulation, and repeat guest tagging (orders ≥ 2).

---

## 3. Production Build & Route Verification

- **Command:** `npm.cmd run build` (Next.js 16.4.0 Turbopack)
- **Result:** Exit code 0.
- **Generated Routes (44 total):**
  - **Storefront Pages:** `/` (Home), `/menu`, `/offers`, `/cart`, `/checkout`, `/book-table`, `/order-tracking/[orderNumber]`, `/order-tracking/search`, `/about`, `/contact`, `/reviews`, `/privacy`, `/terms`.
  - **Admin & Operations Pages:** `/admin` (Overview), `/admin/orders` (Order Processing Table & Drawer), `/admin/kitchen` (KDS Tablet View), `/admin/bookings` (Table Requests & Calendar), `/admin/menu` (Catalog & Price Verifier), `/admin/categories` (Category Hierarchy), `/admin/coupons` (Promotion Builder), `/admin/customers` (Patron Directory), `/admin/analytics` (Telemetry), `/admin/staff` (RBAC), `/admin/settings` (Operational Settings), `/admin/audit-logs` (Immutable Trail), `/admin/login` (Portal).
  - **API Endpoints:** 17 RESTful endpoints covering `/api/admin/*`, `/api/orders`, `/api/bookings`, `/api/coupons/validate`, and `/api/reviews`.

All 18 primary frontend and administrative routes tested via live HTTP GET requests and returned **HTTP 200 OK**.

---

## 4. Bugs Discovered & Resolved During Verification

1. **`getClickToCallUrl` Arity Mismatch:**
   - *Issue:* `src/lib/whatsapp.ts` defined `getClickToCallUrl()` with 0 parameters. Admin screens (Order Drawer, Bookings, Customer Directory) invoked `getClickToCallUrl(phone)` to dial customers.
   - *Fix:* Enhanced `getClickToCallUrl(phoneNumber?: string)` in `src/lib/whatsapp.ts` to accept an optional recipient phone number, falling back to the restaurant line `7451800502` when omitted.
2. **`loadMenu` Reference in `/admin/menu/page.tsx`:**
   - *Issue:* Create and update handlers in `/admin/menu` called `loadMenu()`, which had been named `loadData()`.
   - *Fix:* Standardized all refresh triggers to `loadData()`.
3. **Idempotency Guard in Checkout Form:**
   - *Issue:* Rapid multi-clicks on the checkout "Place Order" button could send concurrent network requests before state updated.
   - *Fix:* Added `if (isSubmitting) return;` at the very start of `handlePlaceOrder` in `src/app/checkout/page.tsx` in addition to HTML button `disabled={isSubmitting}`.
4. **Customer Phone Exposure on Public Order Tracking:**
   - *Issue:* `/order-tracking/[orderNumber]` rendered full unmasked customer phone numbers.
   - *Fix:* Implemented partial masking (`+91 98******56`) on the public tracking invoice to protect customer data privacy if links are shared.

---

## 5. Security Architecture Review

| Security Surface | Audit Finding & Verification | Status |
| :--- | :--- | :--- |
| **Monetary Integrity** | Client-submitted totals are never trusted. All items, variants, crusts, add-ons, coupons, delivery fees, and taxes are recalculated server-side in integer paise before persisting orders. | **VERIFIED** |
| **Price Verification Rule** | Products cannot be published to customers with unverified prices or zero prices. Server rejects publication with 400 Bad Request. | **VERIFIED** |
| **RBAC Authorization** | Owner role strictly required to grant/revoke staff roles or modify core operational settings. Manager, Order Staff, and Kitchen Staff are restricted to permitted scopes. | **VERIFIED** |
| **Audit Logging** | Price changes, coupon launches, order cancellations, booking decisions, and staff role grants write immutable entries to `audit_logs`. | **VERIFIED** |
| **Customer Privacy** | Public tracking pages mask phone numbers; kitchen tablet displays strip all customer financials, totals, and contact directory. | **VERIFIED** |
| **WhatsApp Proof of Order** | WhatsApp links (`7451800502`) explicitly include disclaimers stating that messaging does not constitute accepted order proof. Persistent database record is authoritative. | **VERIFIED** |
| **Secret Management** | `NEXT_PUBLIC_` prefixes restricted strictly to public Supabase URL and anonymous key. Service role keys and webhook secrets reside exclusively in server environments. | **VERIFIED** |

---

## 6. Payment Architecture

- **Active Supported Modes:**
  1. **Cash on Delivery (COD):** Fully validated; delivery address required; bill snapshot stored in paise.
  2. **Pay at Counter (Takeaway):** Available for pickup orders; ₹0 delivery fee applied automatically.
  3. **UPI Dynamic QR Code:** Displays authentic UPI merchant payload (`upi://pay?pa=7451800502@upi...`). Requires customer to input bank UTR transaction reference number for staff manual reconciliation.
- **Online Gateway (Razorpay / Cashfree):**
  - **Current Status:** Intentionally disabled (`online_gateway: false`) in restaurant settings.
  - **No Simulated Success:** Application **never** simulates fake gateway success.
  - **Configuration Instructions:**
    1. Register merchant account with Razorpay or Cashfree.
    2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env.local`.
    3. Implement webhook endpoint at `/api/payments/webhook` with cryptographic signature verification.
    4. Enable `online_gateway: true` in `/admin/settings`.

---

## 7. Pre-Launch Configuration Checklist

Before opening the storefront to real Mathura diners:

1. [ ] **Supabase PostgreSQL Connectivity:**
   - Populate `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in production environment variables.
   - Execute migrations `00001_initial_schema.sql` and `00002_seed_data.sql` in Supabase SQL Editor.
2. [ ] **Initial Restaurant Owner Account:**
   - Sign up via Supabase Auth with email `owner@pizzaharrison.com`.
   - Update `profiles` table to assign role `'owner'`:
     ```sql
     UPDATE profiles SET role = 'owner' WHERE email = 'owner@pizzaharrison.com';
     ```
3. [ ] **Storefront Verification:**
   - Confirm branch addresses on Sonkh Road (Pali Khera) and NH-19 (GLA Gate 1).
   - Verify phone hotline `7451800502` rings directly to the dispatch counter.
4. [ ] **Backup Schedule:**
   - Schedule daily automated PostgreSQL database dump using cron procedure documented in `docs/BACKUP_AND_RECOVERY.md`.
