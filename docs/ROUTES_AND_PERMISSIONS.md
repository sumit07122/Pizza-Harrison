# Pizza Harrison - Routes and Permissions Specification

## 1. Route Hierarchy

### 1.1 Customer-Facing Storefront Routes

| Route Pattern | Component / View | Purpose | Permissions |
| :--- | :--- | :--- | :--- |
| `/` | `src/app/(storefront)/page.tsx` | Brand Homepage, featured pizzas, outlets, CTA | Public |
| `/menu` | `src/app/(storefront)/menu/page.tsx` | Interactive menu with category tabs, search, veg filters, customization modal | Public |
| `/offers` | `src/app/(storefront)/offers/page.tsx` | Student discounts, promotional coupons, combo deals | Public |
| `/cart` | `src/app/(storefront)/cart/page.tsx` | Persistent cart summary, quantity editor, delivery/pickup toggle, bill preview | Public |
| `/checkout` | `src/app/(storefront)/checkout/page.tsx` | Customer details, address, coupon validation, payment selection, order placement | Public |
| `/order-tracking/[code]` | `src/app/(storefront)/order-tracking/[code]/page.tsx` | Realtime status timeline, branch call button, itemized receipt | Public with valid tracking code & phone |
| `/book-table` | `src/app/(storefront)/book-table/page.tsx` | Table reservation request form with branch selection and time slots | Public |
| `/about` | `src/app/(storefront)/about/page.tsx` | Pizza Harrison heritage in Mathura, ingredients quality, outlets | Public |
| `/contact` | `src/app/(storefront)/contact/page.tsx` | Branch contact info, Google Maps embed, inquiry form, operational hours | Public |
| `/reviews` | `src/app/(storefront)/reviews/page.tsx` | Approved customer feedback wall + review submission form | Public |

---

### 1.2 Operations & Administration Dashboard Routes (`/admin/*`)

| Route Pattern | Component / View | Purpose | Min Required Role |
| :--- | :--- | :--- | :--- |
| `/admin/login` | `src/app/admin/login/page.tsx` | Staff & administrator login form | Public |
| `/admin` | `src/app/admin/page.tsx` | Live operational overview, daily revenue, active orders counter, fast stats | `staff` |
| `/admin/orders` | `src/app/admin/orders/page.tsx` | Live Kitchen Display System (KDS), Kanban pipeline, order progression, KOT print | `staff` |
| `/admin/bookings` | `src/app/admin/bookings/page.tsx` | Table reservation requests, confirmation, seating, and cancellation | `staff` |
| `/admin/menu` | `src/app/admin/menu/page.tsx` | Product catalog CRUD, variant prices in paise, toppings, stock availability toggles | `manager` |
| `/admin/coupons` | `src/app/admin/coupons/page.tsx` | Coupon engine: create promo codes, usage limits, discount caps | `manager` |
| `/admin/reviews` | `src/app/admin/reviews/page.tsx` | Customer review moderation (approve/reject) | `manager` |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | Store hours, emergency closure toggle, delivery fees, minimum orders, GST | `admin` |
| `/admin/audit-logs` | `src/app/admin/audit-logs/page.tsx` | Audit log viewer of all administrative operations | `admin` |

---

### 1.3 Server-Side API Endpoints (`/api/*`)

| Endpoint | Method | Purpose | Security Guard |
| :--- | :--- | :--- | :--- |
| `/api/orders` | `POST` | Validates cart items, computes server pricing in paise, creates persistent order | Rate limited, schema validated |
| `/api/orders` | `GET` | Fetches order details for public tracking | Requires matching `order_number` + `phone` |
| `/api/coupons/validate` | `POST` | Validates coupon code against cart subtotal, returns verified discount paise | Public rate-limited |
| `/api/bookings` | `POST` | Creates table reservation request with status `requested` | Public schema validated |
| `/api/reviews` | `POST` | Submits customer review with status `is_approved = false` | Public schema validated |
| `/api/admin/orders/[id]/status` | `PATCH` | Transitions order status (`placed` -> `confirmed` -> `preparing` -> etc.) | Gated: `staff`, `manager`, `admin` |
| `/api/admin/bookings/[id]/status`| `PATCH` | Updates reservation status (`confirmed`, `rejected`, `seated`) | Gated: `staff`, `manager`, `admin` |
| `/api/admin/menu/products` | `POST`/`PUT` | Creates or updates product details, prices, availability | Gated: `manager`, `admin` |
| `/api/admin/coupons` | `POST`/`DELETE`| Creates or deactivates discount coupons | Gated: `manager`, `admin` |
| `/api/admin/settings` | `PUT` | Updates store operational parameters | Gated: `admin` only |

---

## 2. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Anonymous Public | Customer | Staff (Kitchen) | Manager | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Browse Menu & Offers** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Submit Order / Book Table** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Track Own Order** | ✅ (with code) | ✅ | ✅ | ✅ | ✅ |
| **Submit Customer Review** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Access Admin Dashboard** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **View Live Orders & KDS** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Advance Order Kitchen Status**| ❌ | ❌ | ✅ | ✅ | ✅ |
| **Confirm / Seat Reservations**| ❌ | ❌ | ✅ | ✅ | ✅ |
| **Toggle Menu Item Out-of-Stock**| ❌ | ❌ | ✅ | ✅ | ✅ |
| **Create/Edit Menu & Prices** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage Coupons & Discounts** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Moderate Reviews** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Modify Store Hours & Fees** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **View Audit Logs** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Middleware & Session Enforcement

Next.js `middleware.ts` runs on edge requests to enforce access boundaries:
1. Matches `/admin/:path*` (except `/admin/login`).
2. Checks for valid Supabase session cookie (`sb-*-auth-token`).
3. If no session exists, redirects to `/admin/login?next=<encoded_path>`.
4. Decodes user role from token or server profile lookup.
5. If user role has insufficient privileges for the target route (e.g. `staff` trying to access `/admin/settings`), redirects to `/admin` with an unauthorized alert banner.
6. Enforces HTTP security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
