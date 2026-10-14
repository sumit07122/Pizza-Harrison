# Pizza Harrison - Product Specification

## 1. Executive Summary & Brand Identity

**Pizza Harrison** is a premier local pizzeria and fast-food restaurant located in **Mathura, Uttar Pradesh, India**. Known for fresh hand-tossed dough, rich cheese blends, authentic Italian herb seasoning, and student-friendly combos, Pizza Harrison operates across two strategic locations in Mathura:
1. **Pali Khera (Main Outlet):** Sonkh Road, opposite Indian Oil Petrol Pump, Pali Khera, Mathura, UP 281004.
2. **GLA University Branch:** Near Gate No. 1, GLA University, NH-19, Chaumuhan, Mathura, UP 281406.

This software platform provides a unified, production-grade digital ecosystem consisting of:
1. **A Customer-Facing Ordering & Experience Web Application**: High-conversion, mobile-first, interactive digital storefront supporting catalog exploration, pizza customization (crusts, sizes, gourmet toppings), live cart management, checkout with genuine coupon engine, order persistence, real-time order tracking, online table reservation, and customer reviews.
2. **A Restaurant Administration & Kitchen Display Operations Portal**: Role-gated management console for live kitchen order pipeline (realtime Kanban board with audio chime), table reservation management, dynamic menu catalog administration (products, categories, prices, add-ons, availability toggles), coupon campaigns, restaurant operating settings, and audit logs.

---

## 2. Target Audience & Personas

1. **GLA University Students & Hostellers**:
   - High volume during late evenings and weekends.
   - Value-driven: look for student coupons (`GLA100`, `CAMPUS20`), combo meals, and fast delivery to campus hostels/gates.
   - Require fast UPI QR / Cash on Delivery payments and accurate live delivery tracking.
2. **Mathura Families & Local Residents**:
   - Weekend dinner orders and family celebrations.
   - Prefer table reservations at Pali Khera or home delivery.
   - Focus on pure vegetarian options, customized toppings, and generous family feast pizzas.
3. **Highway & Pilgrimage Travelers (NH-19 / Vrindavan-Mathura route)**:
   - Quick roadside pickup or dine-in reservations during peak festival seasons (Janmashtami, Holi).
   - Demand clear location guidance, verified phone lines, and fast order turnaround.
4. **Restaurant Staff & Kitchen Operators**:
   - Need an intuitive, distraction-free Kitchen Display System (KDS) and order management interface.
   - Audio alerts on new orders, one-click status transitions, and easy table management.
5. **Restaurant Managers & Admins**:
   - Require centralized control over menu availability, price updates, discounts, business operating hours, and operational metrics.

---

## 3. Product Functional Requirements

### 3.1 Customer Storefront (`/`)

#### A. Hero & Discovery
- Bold visual hero with high-impact pizza photography and brand typography.
- Quick action pills: "Order Online", "Explore Menu", "Book a Table", "Today's Offers".
- Key restaurant selling points: 100% Fresh Dough, Pure Vegetarian & Jain Options Available, 30-Min Fast Delivery, 4.8★ Local Favorite.
- Live restaurant status badge (e.g., "🟢 Accepting Orders at Both Mathura Outlets").

#### B. Menu Catalog (`/menu`)
- Category navigation tabs: *Popular Pizzas*, *Cheese Burst Specials*, *Garlic Breads & Sides*, *Burgers & Sandwiches*, *Pastas*, *Desserts & Shakes*, *Beverages*.
- Filter by dietary preferences (Veg, Jain Friendly, Spicy, Chef Special).
- Search bar with live debounced filtering.
- Product cards displaying name, description, starting price in INR (₹), dietary badge, and "Customize & Add" button.

#### C. Pizza Customizer Modal
- **Size Selector**: Regular (7" - 4 slices, 1 person), Medium (9" - 6 slices, 2 persons), Large (12" - 8 slices, 3-4 persons).
- **Crust Selection**: New Hand Tossed (default), Cheese Burst (+₹99), Fresh Pan (+₹49), Thin Crust (+₹39).
- **Extra Toppings / Add-ons**: Extra Mozzarella Cheese, Fresh Paneer, Crisp Capsicum, Sweet Corn, Black Olives, Red Paprika, Jalapenos, Mushrooms, Peri-Peri Seasoning.
- Live calculated total price in Indian Rupees (paise-accurate).
- Special preparation instructions input (e.g., "Make it extra crispy", "No onion no garlic").

#### D. Shopping Cart & Billing
- Slide-over / dedicated cart drawer showing all configured items, selected sizes, crusts, add-ons, unit prices, and quantities.
- Option to select **Delivery** (to address/hostel) or **Takeaway / Pickup** (from Pali Khera or GLA University branch).
- Bill breakdown:
  - Items Subtotal
  - Applied Coupon Discount
  - Delivery Fee (₹0 for pickup; calculated based on subtotal threshold)
  - Restaurant GST (5%)
  - Packaging Fee (nominal)
  - **Total Payable Amount** (all in ₹, calculated on server).

#### E. Checkout & Order Submission
- Customer Details: Name, 10-digit Indian Mobile Number, Email (optional for receipt).
- Delivery Address: House/Hostel Room No., Street/Campus, Landmark, City (Mathura).
- Coupon Application: Interactive input with instant server-side validation.
- Genuine Payment Method Options:
  - **Cash on Delivery (COD)** / Pay on Pickup.
  - **UPI QR Code** (Direct scan & pay via PhonePe, GPay, Paytm with UTR/transaction reference input).
  - **Online Payment Gateway** (Razorpay integration hook with clear placeholder indicator if credentials are not configured).
- Order generation creates a persistent record with unique public reference (`PH-YYYYMMDD-XXXX`).

#### F. Realtime Order Tracking (`/order-tracking/[orderNumber]`)
- Step-by-step progress tracker:
  1. `placed` - Order Received by Pizza Harrison
  2. `confirmed` - Accepted & Sent to Kitchen
  3. `preparing` - Baking in Stone Oven
  4. `out_for_delivery` / `ready_for_pickup` - On the Road / Ready at Counter
  5. `completed` - Delivered / Handed Over
- Estimated preparation/delivery time.
- Assigned branch details with direct call button.
- Complete immutable itemized invoice snapshot.

#### G. Table Reservation (`/book-table`)
- Branch selection: Pali Khera Outlet vs GLA University Branch.
- Date picker (up to 14 days in advance) and time slot selector (lunch & dinner slots).
- Number of guests (1 to 20+).
- Seating preference (Indoor AC, Family Lounge, Rooftop/Outdoor).
- Special celebration note (Birthday, Anniversary, Farewell, College Party).
- Instant confirmation token (`TB-YYYYMMDD-XXXX`) marked as `requested`, with staff confirmation workflow.

#### H. Student Offers & Combos (`/offers`)
- Highlighted banner discounts (e.g. `GLA100` - Flat ₹100 Off on orders above ₹499; `MIDNIGHT50` - 20% Off 10 PM to 1 AM).
- One-click "Copy Code & Apply" button.
- Terms & conditions clearly outlined (minimum order value, validity dates, maximum discount cap).

#### I. Customer Reviews & Ratings (`/reviews`)
- Public display of verified customer ratings and feedback.
- Customer submission form (Name, 1-5 Star Rating, Order Reference, Written Review).
- Automatic `pending_moderation` status until approved by staff in the admin panel.

#### J. Restaurant Story & Locations (`/about`, `/contact`)
- Detailed history of Pizza Harrison Mathura, our hygiene pledge, fresh farm ingredients from Braj dairy farmers.
- Interactive location cards with Google Maps embed, phone numbers, WhatsApp link, and opening hours for both branches.

---

### 3.2 Restaurant Administration & Operations Portal (`/admin`)

#### A. Secure Authentication & Role Management
- Supabase Auth integration with server-side cookie sessions.
- Role-based permissions:
  - `admin`: Full system control (menu, staff, prices, settings, coupons, analytics).
  - `manager`: Order management, reservations, menu item availability toggles, review moderation.
  - `staff` (Kitchen): View live orders, advance kitchen status, view table schedule.

#### B. Live Kitchen & Order Management (`/admin/orders`)
- Kanban view by status: **New Orders**, **In Kitchen**, **Out for Delivery / Ready**, **Completed**, **Cancelled**.
- Audio chime trigger when a new order arrives.
- Quick status updater buttons with confirmation dialog.
- Order details drawer: Customer phone (with click-to-call), delivery address, order items breakdown, payment status.
- Print-friendly KOT (Kitchen Order Ticket) and Customer Receipt generation.

#### C. Table Reservation Management (`/admin/bookings`)
- List and calendar view of incoming reservation requests.
- Actions: **Confirm Booking**, **Seat Guests**, **Decline / Cancel**, **Mark Completed**.
- Filter by branch (Pali Khera / GLA) and date.

#### D. Menu & Inventory Management (`/admin/menu`)
- Category Management: Create, edit, reorder categories.
- Product Catalog: Add new items, edit names, descriptions, images, vegetarian tags.
- Price & Variant Management: Set exact prices in paise for Regular, Medium, Large sizes.
- Crust & Add-on Management: Set addon prices and availability.
- Quick Availability Toggle: Instant 1-click switch to mark any pizza or topping "Out of Stock" during peak rushes.

#### E. Promotion & Coupon Engine (`/admin/coupons`)
- Create new coupon codes:
  - Code string (e.g. `MATHURA150`).
  - Discount type: `percentage` (e.g., 20%) or `flat` (e.g., ₹150 / 15000 paise).
  - Minimum order amount threshold in paise.
  - Maximum discount cap in paise.
  - Usage limits (total uses and per-customer phone uses).
  - Expiry date & active toggle.
- Track total redemptions and discount revenue impact.

#### F. Store Settings & Operating Parameters (`/admin/settings`)
- Operating hours per branch (Opening time, Closing time).
- Emergency Store Closure toggle (e.g., "Temporarily closed due to heavy rain / power outage").
- Delivery fee rules: Base delivery charge, free delivery minimum order threshold.
- GST Percentage & packaging fee settings.
- Direct contact numbers and support email.

#### G. Review Moderation (`/admin/reviews`)
- Table of incoming customer reviews.
- 1-click **Approve** or **Reject** action to safeguard public brand reputation against spam.

#### H. Operational Analytics (`/admin/analytics`)
- Real calculations computed from persistent PostgreSQL orders:
  - Today's Revenue & Total Delivered Orders.
  - Average Order Value (AOV).
  - Top 5 selling pizzas and combos.
  - Order volume breakdown: Delivery vs Pickup.
  - Revenue breakdown by payment method.

#### I. Audit Logging (`/admin/audit-logs`)
- Automatic immutable recording of administrative actions:
  - Price changes, menu item deletions, coupon creations, order cancellations.
  - Records staff user ID, action timestamp, entity modified, and before/after state diff.

---

## 4. Acceptance Criteria Summary

| Workflow | Criteria |
| :--- | :--- |
| **Catalog Browsing** | User can browse all categories, filter by veg/specialty, search by name, and view accurate prices in INR without layout shifts. |
| **Pizza Customization** | User can choose size, crust, and add-ons; modal updates item total dynamically with zero floating-point artifacts. |
| **Cart Persistence** | Adding items retains customizations; cart persists across page navigation and page reloads. |
| **Checkout Pricing** | Server recalculates subtotal, applies coupon if valid, computes delivery fee and 5% GST; rejects forged client totals. |
| **Order Placement** | Order creates persistent records in `orders` and `order_items` with unique tracking ID `PH-YYYYMMDD-XXXX`. |
| **Live Tracking** | Customer can view real-time status progression; polling or Supabase Realtime updates UI automatically. |
| **Table Booking** | Customer books table; record saved with status `requested`; admin receives notification and can confirm/seat. |
| **Admin Kitchen Flow**| Staff can move order from `placed` to `confirmed` -> `preparing` -> `out_for_delivery` -> `completed` with immutable history. |
| **Menu Admin** | Admin can toggle item availability or update prices; change takes effect immediately on customer storefront. |
| **Security & RLS** | Anonymous customers cannot access `/admin` or view other customers' orders without tracking code and verification. |
